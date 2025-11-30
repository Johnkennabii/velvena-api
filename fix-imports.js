import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction récursive pour trouver tous les fichiers index.ts
function findIndexFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findIndexFiles(filePath, fileList);
    } else if (file === 'index.ts') {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Trouver tous les fichiers index.ts dans src/docs
const docsPath = path.join(__dirname, 'src', 'docs');
const files = findIndexFiles(docsPath).map(f => path.relative(__dirname, f));

console.log(`Found ${files.length} index.ts files to process\n`);

for (const file of files) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Vérifier si le fichier utilise fs.readFileSync
  if (!content.includes('fs.readFileSync') && !content.includes('loadJson')) {
    continue;
  }

  console.log(`Processing: ${file}`);

  // Extraire les noms de fichiers JSON chargés
  const jsonFileRegex = /loadJson\(["']\.\/([^"']+)["']\)/g;
  const jsonFiles = [];
  let match;

  while ((match = jsonFileRegex.exec(content)) !== null) {
    jsonFiles.push(match[1]);
  }

  if (jsonFiles.length === 0) {
    console.log(`  No JSON files found, skipping\n`);
    continue;
  }

  // Générer les nouveaux imports
  const imports = jsonFiles.map(file => {
    const varName = file.replace('.json', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    return `import ${varName} from "./${file}" with { type: "json" };`;
  }).join('\n');

  // Générer l'export
  const exportVars = jsonFiles.map(file => {
    const varName = file.replace('.json', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    return `  ...${varName}`;
  }).join(',\n');

  // Nouveau contenu
  const newContent = `${imports}\n\nexport default {\n${exportVars},\n};\n`;

  // Écrire le nouveau contenu
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`  ✓ Updated with ${jsonFiles.length} imports\n`);
}

console.log('Done!');
