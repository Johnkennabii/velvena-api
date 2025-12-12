/**
 * Script pour vérifier les associations entre templates et types de contrats
 */

import prisma from "../src/lib/prisma.js";

async function checkAssociations() {
  try {
    console.log("🔍 Vérification des associations templates <-> types de contrats\n");

    // 1. Lister tous les types de contrats
    const contractTypes = await prisma.contractType.findMany({
      select: { id: true, name: true },
    });

    console.log("📋 Types de contrats:");
    contractTypes.forEach(ct => {
      console.log(`  • ${ct.name}: ${ct.id}`);
    });

    // 2. Lister tous les templates avec leurs associations
    console.log("\n📄 Templates et leurs associations:");
    const templates = await prisma.contractTemplate.findMany({
      select: {
        id: true,
        name: true,
        contract_type_id: true,
        is_default: true,
        is_active: true,
      },
      include: {
        contract_type: { select: { name: true } },
      },
    });

    templates.forEach(t => {
      console.log(`\n  • ${t.name}`);
      console.log(`    Type de contrat: ${t.contract_type?.name || "INCONNU"}`);
      console.log(`    contract_type_id: ${t.contract_type_id}`);
      console.log(`    is_default: ${t.is_default ? "✅" : "❌"}`);
      console.log(`    is_active: ${t.is_active ? "✅" : "❌"}`);
    });

    // 3. Vérifier les associations manquantes
    console.log("\n🔗 Vérification des correspondances:");
    for (const ct of contractTypes) {
      const matchingTemplate = templates.find(
        t => t.contract_type_id === ct.id && t.is_default && t.is_active
      );

      if (matchingTemplate) {
        console.log(`  ✅ ${ct.name} → ${matchingTemplate.name}`);
      } else {
        console.log(`  ❌ ${ct.name} → Aucun template par défaut actif`);
      }
    }

  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssociations();
