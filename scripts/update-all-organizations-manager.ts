/**
 * Script de mise à jour : Ajoute les infos du gérant pour toutes les organisations
 *
 * Usage: npx tsx scripts/update-all-organizations-manager.ts
 */

import prisma from "../src/lib/prisma.js";
import logger from "../src/lib/logger.js";

async function updateAllOrganizations() {
  try {
    logger.info("🚀 Début de la mise à jour des organisations");

    // Récupérer toutes les organisations
    const organizations = await prisma.organization.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        siret: true,
        manager_first_name: true,
        manager_last_name: true,
      },
    });

    if (organizations.length === 0) {
      logger.warn("⚠️ Aucune organisation trouvée");
      return;
    }

    logger.info(`📋 ${organizations.length} organisation(s) trouvée(s)`);

    for (const org of organizations) {
      logger.info(`Processing: ${org.name} (${org.slug})`);

      // Si l'organisation a déjà des infos de gérant, on skip
      if (org.siret && org.manager_first_name && org.manager_last_name) {
        logger.info(`  ✓ Déjà rempli, on passe`);
        continue;
      }

      // Mettre à jour avec les infos par défaut (ALLURE CRÉATION)
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          siret: org.siret || "98528788000014",
          manager_gender: "Madame",
          manager_first_name: "Jean",
          manager_last_name: "Dupont",
          manager_title: "gérante",

          // S'assurer que les champs de base sont remplis
          city: "Paris",
          address: "12 rue de la paix",
          postal_code: "75000",
          country: "France",
        },
      });

      logger.info(`  ✅ Mis à jour`);
    }

    logger.info("✅ Mise à jour terminée");
  } catch (error) {
    logger.error({ error }, "❌ Erreur lors de la mise à jour");
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
updateAllOrganizations()
  .then(() => {
    logger.info("✅ Script terminé");
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, "❌ Erreur fatale");
    process.exit(1);
  });
