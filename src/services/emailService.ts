/**
 * Email Service
 * General email sending functions for various notifications
 */

import { sendMail } from "../lib/mailer.js";
import {
  getTrialExpiringEmailTemplate,
  type TrialExpiringEmailData,
} from "../templates/emailTemplates.js";
import logger from "../lib/logger.js";

/**
 * Send trial expiring reminder email
 *
 * @param to - Email address to send to
 * @param data - Trial expiration data
 * @returns Promise that resolves when email is sent
 */
export async function sendTrialExpiringEmail(
  to: string,
  data: TrialExpiringEmailData
): Promise<void> {
  try {
    const htmlContent = getTrialExpiringEmailTemplate(data);

    // Email subject varies by days remaining
    let subject = "";
    if (data.daysRemaining === 1) {
      subject = `🚨 Dernière chance ! Votre essai Velvena se termine demain`;
    } else if (data.daysRemaining === 3) {
      subject = `⚡ Plus que 3 jours pour profiter de votre essai Velvena`;
    } else if (data.daysRemaining === 7) {
      subject = `📅 Votre essai Velvena se termine dans 7 jours`;
    } else {
      subject = `⏰ Votre essai Velvena se termine bientôt`;
    }

    await sendMail({
      to,
      subject,
      html: htmlContent,
      text: `Votre période d'essai se termine dans ${data.daysRemaining} jour${data.daysRemaining > 1 ? "s" : ""}. Pour continuer à utiliser Velvena, souscrivez à un abonnement : ${data.upgradeUrl}`,
    });

    logger.info(
      {
        to,
        organizationName: data.organizationName,
        daysRemaining: data.daysRemaining,
        trialEndsAt: data.trialEndsAt,
      },
      "Trial expiring email sent successfully"
    );
  } catch (error: any) {
    logger.error(
      {
        err: error,
        to,
        organizationName: data.organizationName,
        daysRemaining: data.daysRemaining,
      },
      "Failed to send trial expiring email"
    );

    // Rethrow error so the script can log it and continue with other organizations
    throw error;
  }
}
