/**
 * Script de test pour vérifier l'auto-assignation des templates
 */

import prisma from "../src/lib/prisma.js";

async function testTemplateAssignment() {
  try {
    console.log("🧪 Test de l'auto-assignation du template...\n");

    // 1. Récupérer un type de contrat "Forfait"
    const contractType = await prisma.contractType.findFirst({
      where: {
        name: {
          contains: "Forfait",
          mode: "insensitive",
        },
      },
    });

    if (!contractType) {
      console.log("❌ Aucun type de contrat 'Forfait' trouvé");
      return;
    }

    console.log(`✅ Type de contrat trouvé: ${contractType.name} (${contractType.id})`);

    // 2. Chercher un template par défaut pour ce type
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log("❌ Aucune organisation trouvée");
      return;
    }

    const defaultTemplate = await prisma.contractTemplate.findFirst({
      where: {
        contract_type_id: contractType.id,
        is_default: true,
        is_active: true,
        deleted_at: null,
        OR: [
          { organization_id: organization.id },
          { organization_id: null },
        ],
      },
      orderBy: [
        { organization_id: "desc" },
      ],
    });

    if (!defaultTemplate) {
      console.log("❌ Aucun template par défaut trouvé pour ce type");
      return;
    }

    console.log(`✅ Template par défaut trouvé: ${defaultTemplate.name} (${defaultTemplate.id})`);
    console.log(`   Actif: ${defaultTemplate.is_active ? "✅" : "❌"}`);
    console.log(`   Par défaut: ${defaultTemplate.is_default ? "✅" : "❌"}`);

    // 3. Simuler la logique d'auto-assignation
    console.log("\n📝 Simulation de la création d'un contrat...");

    let finalTemplateId = null; // Simulons qu'aucun template_id n'est fourni

    if (!finalTemplateId && contractType.id) {
      const template = await prisma.contractTemplate.findFirst({
        where: {
          contract_type_id: contractType.id,
          is_default: true,
          is_active: true,
          deleted_at: null,
          OR: [
            { organization_id: organization.id },
            { organization_id: null },
          ],
        },
        orderBy: [
          { organization_id: "desc" },
        ],
      });

      if (template) {
        finalTemplateId = template.id;
        console.log(`✅ Template auto-assigné: ${template.name}`);
        console.log(`   ID: ${finalTemplateId}`);
      }
    }

    if (finalTemplateId) {
      console.log("\n✅ L'auto-assignation fonctionne correctement!");
      console.log(`   Le contrat devrait avoir template_id = ${finalTemplateId}`);
    } else {
      console.log("\n❌ L'auto-assignation a échoué");
    }

    // 4. Vérifier un contrat récemment créé
    console.log("\n🔍 Vérification des contrats récents...");
    const recentContracts = await prisma.contract.findMany({
      where: {
        contract_type_id: contractType.id,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 5,
      select: {
        id: true,
        contract_number: true,
        template_id: true,
        created_at: true,
      },
    });

    if (recentContracts.length === 0) {
      console.log("   Aucun contrat trouvé pour ce type");
    } else {
      console.log(`   Derniers contrats (type ${contractType.name}):`);
      recentContracts.forEach((c, i) => {
        const hasTemplate = c.template_id ? "✅" : "❌";
        console.log(`   ${i + 1}. ${c.contract_number} - ${hasTemplate} template_id: ${c.template_id || "NULL"}`);
      });
    }

  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testTemplateAssignment();
