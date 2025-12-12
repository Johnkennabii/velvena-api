/**
 * Script pour vérifier les templates existants dans la base de données
 */

import prisma from "../src/lib/prisma.js";

async function checkTemplates() {
  try {
    console.log("🔍 Vérification des templates dans la base de données...\n");

    // Compter tous les templates
    const totalTemplates = await prisma.contractTemplate.count();
    console.log(`📊 Total de templates: ${totalTemplates}`);

    if (totalTemplates === 0) {
      console.log("\n⚠️  Aucun template trouvé dans la base de données!");
      console.log("💡 Vous devez créer des templates pour que l'auto-assignation fonctionne.");
      console.log("   Utilisez l'un de ces scripts:");
      console.log("   - npx tsx scripts/seed-default-templates.ts");
      console.log("   - Ou créez des templates via l'API POST /contract-templates");
      return;
    }

    // Lister tous les templates
    const templates = await prisma.contractTemplate.findMany({
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
      orderBy: [
        { is_default: "desc" },
        { created_at: "desc" },
      ],
    });

    console.log("\n📄 Liste des templates:\n");

    templates.forEach((template, index) => {
      const isDefault = template.is_default ? "✅ PAR DÉFAUT" : "  ";
      const isActive = template.is_active ? "🟢" : "🔴";
      const scope = template.organization_id ? `🏢 ${template.organization?.name}` : "🌍 Global";

      console.log(`${index + 1}. ${isDefault} ${isActive} ${template.name}`);
      console.log(`   Type de contrat: ${template.contract_type?.name || "N/A"}`);
      console.log(`   Portée: ${scope}`);
      console.log(`   ID: ${template.id}`);
      console.log("");
    });

    // Afficher les templates par défaut par type
    const defaultTemplatesByType = templates.filter(t => t.is_default && t.is_active);

    if (defaultTemplatesByType.length > 0) {
      console.log("\n🎯 Templates par défaut actifs:\n");
      defaultTemplatesByType.forEach(template => {
        console.log(`  • ${template.contract_type?.name}: ${template.name}`);
      });
    } else {
      console.log("\n⚠️  Aucun template par défaut actif trouvé!");
      console.log("   Les contrats ne seront pas automatiquement associés à un template.");
    }

  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplates();
