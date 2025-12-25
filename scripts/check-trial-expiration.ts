/**
 * Check Trial Expiration - Send reminder emails
 *
 * This script checks for organizations whose trial is about to expire
 * and sends reminder emails at:
 * - 7 days before expiration
 * - 3 days before expiration
 * - 1 day before expiration
 *
 * Scheduled to run daily via cron
 */

import prisma from "../src/lib/prisma.js";
import { sendTrialExpiringEmail } from "../src/services/emailService.js";
import pino from "pino";

const logger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: false,
      translateTime: "SYS:standard",
    },
  },
});

async function checkTrialExpiration() {
  const now = new Date();

  // Calculate dates for 7, 3, and 1 day warnings
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  logger.info("🔍 Starting trial expiration check...");
  logger.info({
    currentDate: now.toISOString(),
    sevenDaysTarget: sevenDaysFromNow.toISOString(),
    threeDaysTarget: threeDaysFromNow.toISOString(),
    oneDayTarget: oneDayFromNow.toISOString(),
  });

  try {
    // Find organizations in trial period
    const organizations = await prisma.organization.findMany({
      where: {
        subscription_status: "trial",
        trial_ends_at: {
          not: null,
          gt: now, // Only active trials
        },
        is_active: true,
      },
      include: {
        users: {
          where: {
            profile: {
              role: {
                name: { in: ["MANAGER", "ADMIN"] }, // Only notify admins/managers
              },
            },
          },
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    logger.info(`📊 Found ${organizations.length} organizations in trial period`);

    let emailsSent = 0;
    let errors = 0;

    for (const org of organizations) {
      if (!org.trial_ends_at) continue;

      const trialEndsAt = new Date(org.trial_ends_at);
      const daysUntilExpiration = Math.ceil(
        (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine if we should send an email
      let shouldSend = false;
      let daysMark = 0;

      // Check if trial expires in exactly 7, 3, or 1 day(s)
      // Using a tolerance of ±12 hours to account for cron timing
      const tolerance = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

      if (Math.abs(trialEndsAt.getTime() - sevenDaysFromNow.getTime()) < tolerance) {
        shouldSend = true;
        daysMark = 7;
      } else if (Math.abs(trialEndsAt.getTime() - threeDaysFromNow.getTime()) < tolerance) {
        shouldSend = true;
        daysMark = 3;
      } else if (Math.abs(trialEndsAt.getTime() - oneDayFromNow.getTime()) < tolerance) {
        shouldSend = true;
        daysMark = 1;
      }

      if (!shouldSend) {
        logger.debug({
          organizationId: org.id,
          organizationName: org.name,
          daysUntilExpiration,
          trialEndsAt: trialEndsAt.toISOString(),
          message: "No email needed (not at 7/3/1 day mark)",
        });
        continue;
      }

      logger.info({
        organizationId: org.id,
        organizationName: org.name,
        daysUntilExpiration: daysMark,
        trialEndsAt: trialEndsAt.toISOString(),
        usersToNotify: org.users.length,
      }, `📧 Sending ${daysMark}-day trial expiration reminder`);

      // Send email to all admin/manager users
      for (const user of org.users) {
        try {
          await sendTrialExpiringEmail(
            user.email,
            {
              organizationName: org.name,
              userName: user.profile?.first_name || "User",
              daysRemaining: daysMark,
              trialEndsAt: trialEndsAt,
              upgradeUrl: `${process.env.APP_URL || "https://app.velvena.fr"}/settings/billing`,
            }
          );

          logger.info({
            userId: user.id,
            email: user.email,
            organizationId: org.id,
            daysRemaining: daysMark,
          }, "✅ Trial expiration email sent");

          emailsSent++;
        } catch (error: any) {
          logger.error({
            error: error.message,
            userId: user.id,
            email: user.email,
            organizationId: org.id,
          }, "❌ Failed to send trial expiration email");

          errors++;
        }
      }
    }

    logger.info({
      totalOrganizations: organizations.length,
      emailsSent,
      errors,
    }, "✅ Trial expiration check completed");

    return {
      success: true,
      totalOrganizations: organizations.length,
      emailsSent,
      errors,
    };
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, "❌ Error checking trial expiration");
    throw error;
  }
}

// Run the script
checkTrialExpiration()
  .then((result) => {
    logger.info(result, "Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, "Script failed");
    process.exit(1);
  });
