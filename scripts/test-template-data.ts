/**
 * Script de test : Vérifier que les données du template fonctionnent
 *
 * Usage: npx tsx scripts/test-template-data.ts
 */

import prisma from "../src/lib/prisma.js";
import { prepareContractTemplateData } from "../src/services/templateDataService.js";
import logger from "../src/lib/logger.js";

async function testTemplateData() {
  try {
    logger.info("🔍 Test des données de template");

    // Récupérer la première organisation
    const organization = await prisma.organization.findFirst({
      where: { deleted_at: null },
    });

    if (!organization) {
      logger.error("❌ Aucune organisation trouvée");
      return;
    }

    logger.info(`📋 Organisation: ${organization.name}`);
    logger.info(`   Ville: ${organization.city}`);
    logger.info(`   SIRET: ${organization.siret}`);
    logger.info(`   Gérant: ${organization.manager_gender} ${organization.manager_first_name} ${organization.manager_last_name}`);
    logger.info(`   Titre: ${organization.manager_title}`);

    // Récupérer le premier contrat
    const contract = await prisma.contract.findFirst({
      where: {
        organization_id: organization.id,
        deleted_at: null,
      },
      include: {
        customer: true,
        contract_type: true,
        organization: true,
        package: {
          include: {
            addons: { include: { addon: true } },
          },
        },
        dresses: { include: { dress: true } },
        addon_links: { include: { addon: true } },
      },
    });

    if (!contract) {
      logger.warn("⚠️ Aucun contrat trouvé, on arrête ici");
      logger.info("✅ Mais les données de l'organisation sont bonnes !");
      return;
    }

    logger.info(`\n📄 Contrat: ${contract.contract_number}`);

    // Préparer les données du template
    const templateData = prepareContractTemplateData(contract);

    logger.info("\n🎨 Données du template préparées:");
    logger.info("\n📍 Organisation:");
    logger.info(`   org.name: ${templateData.org.name}`);
    logger.info(`   org.city: ${templateData.org.city}`);
    logger.info(`   org.siret: ${templateData.org.siret}`);
    logger.info(`   org.managerGender: ${templateData.org.managerGender}`);
    logger.info(`   org.managerFullName: ${templateData.org.managerFullName}`);
    logger.info(`   org.managerInitials: ${templateData.org.managerInitials}`);
    logger.info(`   org.managerTitle: ${templateData.org.managerTitle}`);
    logger.info(`   org.fullAddress: ${templateData.org.fullAddress}`);

    logger.info("\n👤 Client:");
    logger.info(`   client.fullName: ${templateData.client.fullName}`);
    logger.info(`   client.email: ${templateData.client.email}`);

    logger.info("\n📋 Contrat:");
    logger.info(`   contract.number: ${templateData.contract.number}`);
    logger.info(`   contract.type: ${templateData.contract.type}`);
    logger.info(`   contract.totalTTC: ${templateData.contract.totalTTC}`);

    if (templateData.signature) {
      logger.info("\n✍️ Signature électronique:");
      logger.info(`   signature.date: ${templateData.signature.date}`);
      logger.info(`   signature.ip: ${templateData.signature.ip}`);
      logger.info(`   signature.location: ${templateData.signature.location}`);
    } else {
      logger.info("\n✍️ Pas encore signé (signature manuelle)");
    }

    logger.info("\n📅 Dates:");
    logger.info(`   today: ${templateData.today}`);

    logger.info("\n✅ Test réussi ! Les données sont prêtes pour les templates");
  } catch (error) {
    logger.error({ error }, "❌ Erreur lors du test");
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
testTemplateData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, "❌ Erreur fatale");
    process.exit(1);
  });
