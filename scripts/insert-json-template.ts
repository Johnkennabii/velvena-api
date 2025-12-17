import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import prisma from "../src/lib/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

async function insertJsonTemplate() {
  try {
    console.log("🚀 Insertion du template JSON d'exemple...\n");

    // 1. Charger le template JSON
    const templatePath = join(__dirname, "../examples/template-location-simple.json");
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    const templateStructure = JSON.parse(templateContent);

    console.log(`📄 Template chargé: ${templateStructure.metadata.name}`);
    console.log(`   Version: ${templateStructure.version}`);
    console.log(`   Sections: ${templateStructure.sections.length}`);
    console.log("");

    // 2. Récupérer le ContractType "Location"
    const contractType = await prisma.contractType.findFirst({
      where: { name: "Location" },
    });

    if (!contractType) {
      console.error("❌ ContractType 'Location' not found");
      console.log("\n💡 Créez d'abord un type de contrat 'Location'");
      process.exit(1);
    }

    console.log(`✅ ContractType trouvé: ${contractType.name} (${contractType.id})`);

    // 3. Récupérer une organisation active
    const organization = await prisma.organization.findFirst({
      where: { is_active: true, deleted_at: null },
    });

    if (!organization) {
      console.error("❌ No active organization found");
      process.exit(1);
    }

    console.log(`✅ Organisation trouvée: ${organization.name} (${organization.id})`);
    console.log("");

    // 4. Vérifier si un template par défaut existe pour ce type de contrat
    const existing = await prisma.contractTemplate.findFirst({
      where: {
        contract_type_id: contractType.id,
        organization_id: organization.id,
        is_default: true,
        deleted_at: null,
      },
    });

    if (existing) {
      console.log("⚠️  Un template par défaut existe déjà pour ce type de contrat");
      console.log(`   ID: ${existing.id}`);
      console.log(`   Nom: ${existing.name}`);
      console.log(`   Version: ${existing.version}`);
      console.log("");

      // Mettre à jour le template existant
      console.log("📝 Mise à jour du template existant avec la structure JSON...");

      const updated = await prisma.contractTemplate.update({
        where: { id: existing.id },
        data: {
          name: templateStructure.metadata.name,
          structure: templateStructure,
          version: { increment: 1 },
          description: templateStructure.metadata.description,
        },
      });

      console.log("");
      console.log("✅ Template mis à jour avec succès !");
      console.log(JSON.stringify({
        id: updated.id,
        name: updated.name,
        version: updated.version,
        has_structure: !!updated.structure,
        contract_type: contractType.name,
        organization: organization.name,
      }, null, 2));

      console.log("");
      console.log("🎉 Le template JSON est maintenant actif !");
      console.log("");
      console.log("📋 Prochaines étapes:");
      console.log("  1. Créer un contrat avec ce type de contrat");
      console.log("  2. Générer le PDF du contrat");
      console.log("  3. Vérifier que le rendu utilise le système JSON unifié");

      return;
    }

    // 5. Créer le nouveau template avec transaction
    console.log("📝 Création du template JSON...");

    const template = await prisma.$transaction(async (tx) => {
      // Retirer le défaut d'autres templates
      await tx.contractTemplate.updateMany({
        where: {
          contract_type_id: contractType.id,
          organization_id: organization.id,
          is_default: true,
          deleted_at: null,
        },
        data: { is_default: false },
      });

      // Créer le nouveau template
      return await tx.contractTemplate.create({
        data: {
          name: templateStructure.metadata.name,
          description: templateStructure.metadata.description || null,
          contract_type_id: contractType.id,
          organization_id: organization.id,
          structure: templateStructure,
          content: null, // Pas de HTML legacy
          is_default: true,
          is_active: true,
          created_by: null,
        },
        include: {
          contract_type: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    });

    console.log("");
    console.log("✅ Template créé avec succès !");
    console.log(JSON.stringify({
      id: template.id,
      name: template.name,
      version: template.version,
      has_structure: !!template.structure,
      is_default: template.is_default,
      contract_type: template.contract_type?.name,
      organization: template.organization?.name,
    }, null, 2));

    console.log("");
    console.log("🎉 Vous pouvez maintenant générer des PDFs avec ce template !");
    console.log("");
    console.log("📋 Prochaines étapes:");
    console.log("  1. Créer un contrat avec template_id =", template.id);
    console.log("  2. Générer le PDF du contrat");
    console.log("  3. Vérifier que le rendu utilise le système JSON unifié");

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

insertJsonTemplate();
