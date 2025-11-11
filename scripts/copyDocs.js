// scripts/copyDocs.js
import fs from "fs";
import path from "path";

const srcDir = path.resolve("src/docs");
const distDir = path.resolve("dist/docs");

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  for (const file of fs.readdirSync(src)) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.lstatSync(srcPath);

    if (stat.isDirectory()) {
      copyRecursiveSync(srcPath, destPath);
    } else {
      // 🚫 Ignore tous les fichiers TypeScript
      if (file.endsWith(".ts")) continue;

      // ✅ Copie uniquement JSON, YAML, ou fichiers statiques
      if (/\.(json|yaml|yml)$/.test(file)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`📄 Copied ${srcPath} -> ${destPath}`);
      }
    }
  }
}

copyRecursiveSync(srcDir, distDir);
console.log("✅ Docs JSON copiés vers dist/docs (sans .ts)");