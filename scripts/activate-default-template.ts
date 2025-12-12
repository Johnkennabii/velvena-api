/**
 * Script pour activer un template et le définir comme par défaut
 */

import prisma from "../src/lib/prisma.js";

async function activateDefaultTemplate() {
  try {
    // Lister tous les templates
    const templates = await prisma.contractTemplate.findMany({
      include: {
        contract_type: true,
        organization: true,
      },
    });

    if (templates.length === 0) {
      console.log("❌ Aucun template trouvé. Créez-en un d'abord.");
      return;
    }

    console.log("📄 Templates disponibles:\n");
    templates.forEach((t, i) => {
      console.log(`${i + 1}. ${t.name}`);
      console.log(`   Type: ${t.contract_type?.name}`);
      console.log(`   Organisation: ${t.organization?.name || "Global"}`);
      console.log(`   ID: ${t.id}`);
      console.log(`   Actif: ${t.is_active ? "✅" : "❌"}`);
      console.log(`   Par défaut: ${t.is_default ? "✅" : "❌"}`);
      console.log("");
    });

    // Pour ce script, activons le premier template "Forfait" trouvé
    const forfaitTemplate = templates.find(t =>
      t.contract_type?.name?.toLowerCase().includes("forfait")
    );

    if (!forfaitTemplate) {
      console.log("❌ Aucun template de type Forfait trouvé.");
      return;
    }

    console.log(`\n🎯 Activation du template: "${forfaitTemplate.name}"\n`);

    // Désactiver tous les autres templates par défaut du même type et organisation
    await prisma.contractTemplate.updateMany({
      where: {
        contract_type_id: forfaitTemplate.contract_type_id,
        organization_id: forfaitTemplate.organization_id,
        is_default: true,
      },
      data: {
        is_default: false,
      },
    });

    // Activer le template choisi
    const updated = await prisma.contractTemplate.update({
      where: { id: forfaitTemplate.id },
      data: {
        is_active: true,
        is_default: true,
      },
      include: {
        contract_type: true,
        organization: true,
      },
    });

    console.log("✅ Template activé avec succès!");
    console.log(`   Nom: ${updated.name}`);
    console.log(`   Type: ${updated.contract_type?.name}`);
    console.log(`   Organisation: ${updated.organization?.name || "Global"}`);
    console.log(`   Actif: ${updated.is_active ? "✅" : "❌"}`);
    console.log(`   Par défaut: ${updated.is_default ? "✅" : "❌"}`);

  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

activateDefaultTemplate();
