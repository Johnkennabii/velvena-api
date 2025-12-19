/**
 * Job de nettoyage des périodes d'essai expirées
 *
 * Ce job s'exécute quotidiennement pour :
 * 1. Identifier les organisations dont la période d'essai est expirée
 * 2. Mettre à jour leur statut de souscription
 * 3. Notifier les utilisateurs concernés (optionnel)
 */

import { PrismaClient } from "@prisma/client";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const prisma = new PrismaClient();

interface TrialExpirationResult {
  totalChecked: number;
  expired: number;
  updated: number;
  errors: number;
  organizationIds: string[];
}

/**
 * Traite les organisations dont la période d'essai est expirée
 */
export async function processExpiredTrials(): Promise<TrialExpirationResult> {
  const now = new Date();
  const result: TrialExpirationResult = {
    totalChecked: 0,
    expired: 0,
    updated: 0,
    errors: 0,
    organizationIds: [],
  };

  try {
    logger.info("🔍 Démarrage du job de nettoyage des trials expirés");

    // Rechercher toutes les organisations en période d'essai
    const organizations = await prisma.organization.findMany({
      where: {
        subscription_status: "trial",
        trial_ends_at: {
          not: null,
        },
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        trial_ends_at: true,
        subscription_status: true,
        users: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          take: 1,
        },
      },
    });

    result.totalChecked = organizations.length;
    logger.info({ count: result.totalChecked }, "📊 Organisations en trial trouvées");

    // Traiter chaque organisation
    for (const org of organizations) {
      try {
        // Vérifier si la période d'essai est expirée
        if (org.trial_ends_at && org.trial_ends_at < now) {
          result.expired++;
          logger.info(
            {
              organizationId: org.id,
              organizationName: org.name,
              trialEndsAt: org.trial_ends_at,
            },
            "⏰ Trial expiré détecté"
          );

          // Mettre à jour le statut de l'organisation
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              subscription_status: "trial_expired",
              updated_at: now,
            },
          });

          result.updated++;
          result.organizationIds.push(org.id);

          logger.info(
            {
              organizationId: org.id,
              organizationName: org.name,
            },
            "✅ Statut mis à jour vers 'trial_expired'"
          );

          // TODO: Envoyer une notification par email au propriétaire
          if (org.users.length > 0) {
            const owner = org.users[0];
            if (owner) {
              logger.info(
                {
                  ownerId: owner.id,
                  ownerEmail: owner.email,
                  organizationName: org.name,
                },
                "📧 Notification par email à envoyer (TODO)"
              );
              // await sendTrialExpiredEmail(owner.email, org.name);
            }
          }
        }
      } catch (error) {
        result.errors++;
        logger.error(
          {
            organizationId: org.id,
            organizationName: org.name,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "❌ Erreur lors du traitement de l'organisation"
        );
      }
    }

    logger.info(
      {
        totalChecked: result.totalChecked,
        expired: result.expired,
        updated: result.updated,
        errors: result.errors,
      },
      "✅ Job de nettoyage des trials terminé"
    );

    return result;
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "❌ Erreur critique dans le job de nettoyage des trials"
    );
    throw error;
  }
}

/**
 * Traite également les souscriptions expirées (non-trial)
 */
export async function processExpiredSubscriptions(): Promise<TrialExpirationResult> {
  const now = new Date();
  const result: TrialExpirationResult = {
    totalChecked: 0,
    expired: 0,
    updated: 0,
    errors: 0,
    organizationIds: [],
  };

  try {
    logger.info("🔍 Démarrage du job de nettoyage des souscriptions expirées");

    // Rechercher les organisations avec souscription active mais expirée
    const organizations = await prisma.organization.findMany({
      where: {
        subscription_status: "active",
        subscription_ends_at: {
          not: null,
          lt: now,
        },
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        subscription_ends_at: true,
        subscription_status: true,
      },
    });

    result.totalChecked = organizations.length;
    logger.info({ count: result.totalChecked }, "📊 Souscriptions actives trouvées");

    for (const org of organizations) {
      try {
        result.expired++;
        logger.info(
          {
            organizationId: org.id,
            organizationName: org.name,
            subscriptionEndsAt: org.subscription_ends_at,
          },
          "⏰ Souscription expirée détectée"
        );

        // Mettre à jour le statut
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            subscription_status: "expired",
            updated_at: now,
          },
        });

        result.updated++;
        result.organizationIds.push(org.id);

        logger.info(
          {
            organizationId: org.id,
            organizationName: org.name,
          },
          "✅ Statut mis à jour vers 'expired'"
        );
      } catch (error) {
        result.errors++;
        logger.error(
          {
            organizationId: org.id,
            organizationName: org.name,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "❌ Erreur lors du traitement de la souscription"
        );
      }
    }

    logger.info(
      {
        totalChecked: result.totalChecked,
        expired: result.expired,
        updated: result.updated,
        errors: result.errors,
      },
      "✅ Job de nettoyage des souscriptions terminé"
    );

    return result;
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "❌ Erreur critique dans le job de nettoyage des souscriptions"
    );
    throw error;
  }
}

/**
 * Fonction principale qui exécute tous les jobs de nettoyage
 */
export async function runSubscriptionMaintenanceJobs(): Promise<{
  trials: TrialExpirationResult;
  subscriptions: TrialExpirationResult;
}> {
  logger.info("🚀 Démarrage des jobs de maintenance des souscriptions");

  const trials = await processExpiredTrials();
  const subscriptions = await processExpiredSubscriptions();

  logger.info(
    {
      trials: {
        checked: trials.totalChecked,
        expired: trials.expired,
        updated: trials.updated,
        errors: trials.errors,
      },
      subscriptions: {
        checked: subscriptions.totalChecked,
        expired: subscriptions.expired,
        updated: subscriptions.updated,
        errors: subscriptions.errors,
      },
    },
    "🏁 Tous les jobs de maintenance terminés"
  );

  return { trials, subscriptions };
}
