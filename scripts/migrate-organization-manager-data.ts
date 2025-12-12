/**
 * Script de migration : Remplir les données du gérant pour ALLURE CRÉATION
 *
 * Usage: npx tsx scripts/migrate-organization-manager-data.ts
 */

import prisma from "../src/lib/prisma.js";
import logger from "../src/lib/logger.js";

async function migrateOrganizationManagerData() {
  try {
    logger.info("🚀 Début de la migration des données du gérant");

    // Trouver l'organisation ALLURE CRÉATION par son slug
    const allureCreation = await prisma.organization.findUnique({
      where: { slug: "boutique-paris" },
    });

    if (!allureCreation) {
      logger.warn("⚠️ Organisation 'allure-creation' introuvable, tentative par nom...");

      // Fallback : chercher par nom
      const orgByName = await prisma.organization.findFirst({
        where: {
          name: {
            contains: "BOUTIQUE PARIS",
            mode: "insensitive"
          }
        },
      });

      if (!orgByName) {
        logger.error("❌ Impossible de trouver l'organisation BOUTIQUE PARIS");
        process.exit(1);
      }

      logger.info("✅ Organisation trouvée par nom");
      await updateOrganization(orgByName.id);
    } else {
      logger.info("✅ Organisation trouvée par slug");
      await updateOrganization(allureCreation.id);
    }

    logger.info("✅ Migration terminée avec succès");
  } catch (error) {
    logger.error({ error }, "❌ Erreur lors de la migration");
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function updateOrganization(organizationId: string) {
  const updatedOrg = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      // SIRET
      siret: "98528788000014", // Format sans espaces pour la DB

      // Informations du gérant
      manager_gender: "Madame",
      manager_first_name: "Gérante prénom",
      manager_last_name: "Gérante nom",
      manager_title: "gérante",

      // Vérifier que les autres champs sont bien remplis
      city: "Paris",
      address: "4 avenue Laurent Cély",
      postal_code: "92600",
      country: "France",
    },
  });

  logger.info({
    organizationId: updatedOrg.id,
    name: updatedOrg.name,
    siret: updatedOrg.siret,
    managerFullName: `${updatedOrg.manager_first_name} ${updatedOrg.manager_last_name}`,
  }, "📝 Organisation mise à jour");
}

// Exécution
migrateOrganizationManagerData()
  .then(() => {
    logger.info("✅ Script terminé");
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, "❌ Erreur fatale");
    process.exit(1);
  });
