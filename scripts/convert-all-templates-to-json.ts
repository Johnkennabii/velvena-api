import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import prisma from "../src/lib/prisma.js";
import type { TemplateStructure } from "../src/services/unifiedTemplateRenderer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

/**
 * Convertit un template HTML/Handlebars en structure JSON
 *
 * Cette fonction analyse le HTML et tente de créer une structure JSON équivalente
 * Pour une conversion plus précise, il faudrait parser le HTML proprement
 *
 * Pour l'instant, on crée une structure basique qui affiche le HTML dans une section rich_text
 */
function convertHTMLToJSON(
  templateName: string,
  htmlContent: string,
  contractTypeName: string
): TemplateStructure {
  return {
    version: "2.0",
    metadata: {
      name: templateName,
      description: `Template converti automatiquement depuis HTML (${contractTypeName})`,
      category: contractTypeName.toLowerCase(),
    },
    sections: [
      {
        id: "header",
        type: "header",
        title: contractTypeName,
        subtitle: "Contrat n° {{contract_number}} — {{created_at}}",
        style: {
          textAlign: "center",
          marginBottom: "2rem",
        },
      },
      {
        id: "legacy_content",
        type: "rich_text",
        title: "",
        content: htmlContent,
      },
    ],
  };
}

async function convertAllTemplates() {
  try {
    console.log("🔄 Conversion de tous les templates HTML vers JSON...\n");

    // 1. Récupérer tous les templates qui n'ont PAS encore de structure JSON
    const allTemplates = await prisma.contractTemplate.findMany({
      where: {
        content: { not: null }, // A du contenu HTML
        deleted_at: null,
      },
      include: {
        contract_type: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filtrer ceux qui n'ont pas encore de structure JSON
    const templates = allTemplates.filter(t => !t.structure);

    if (templates.length === 0) {
      console.log("✅ Tous les templates sont déjà convertis en JSON !");
      console.log(`   ${allTemplates.length} template(s) au total`);
      console.log("");
      return;
    }

    console.log(`📋 ${templates.length} template(s) à convertir:\n`);

    for (const template of templates) {
      console.log(`📄 ${template.name}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Type: ${template.contract_type?.name || "N/A"}`);
      console.log(`   Organisation: ${template.organization?.name || "Global"}`);
      console.log(`   Content length: ${template.content?.length || 0} caractères`);
    }

    console.log("");
    console.log("⚠️  ATTENTION:");
    console.log("   Cette conversion crée une structure JSON basique");
    console.log("   Le HTML sera conservé dans une section 'rich_text'");
    console.log("   Pour une conversion plus avancée (sections séparées),");
    console.log("   il faudra créer manuellement la structure JSON");
    console.log("");

    // 2. Convertir chaque template
    let converted = 0;
    let errors = 0;

    for (const template of templates) {
      try {
        console.log(`\n🔄 Conversion de: ${template.name}...`);

        const structure = convertHTMLToJSON(
          template.name,
          template.content || "",
          template.contract_type?.name || "Contrat"
        );

        // Mettre à jour avec la structure JSON
        await prisma.contractTemplate.update({
          where: { id: template.id },
          data: {
            structure: structure as any,
            version: { increment: 1 },
          },
        });

        console.log(`✅ Converti avec succès (version ${template.version + 1})`);
        converted++;
      } catch (error: any) {
        console.error(`❌ Erreur lors de la conversion de ${template.name}:`, error.message);
        errors++;
      }
    }

    console.log("");
    console.log("═".repeat(60));
    console.log(`📊 Résumé de la conversion:`);
    console.log(`   ✅ Convertis: ${converted}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log(`   📋 Total: ${templates.length}`);
    console.log("═".repeat(60));

    if (converted > 0) {
      console.log("");
      console.log("🎉 Conversion terminée avec succès !");
      console.log("");
      console.log("📋 Prochaines étapes:");
      console.log("  1. Tester la génération PDF de chaque template converti");
      console.log("  2. Comparer avec les PDFs générés avant conversion");
      console.log("  3. Améliorer manuellement les structures JSON si nécessaire");
      console.log("     (séparer en sections, ajouter tableaux, etc.)");
      console.log("");
      console.log("💡 Pour créer une structure JSON avancée:");
      console.log("   - Voir examples/template-location-simple.json");
      console.log("   - Utiliser l'API POST /contract-templates avec 'structure'");
    }

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

convertAllTemplates();
