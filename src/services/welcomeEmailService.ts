/**
 * Welcome Email Service
 * Sends welcome emails to new organizations
 */

import { sendMail } from "../lib/mailer.js";
import {
  getWelcomeEmailTemplate,
  getWelcomeEmailText,
  type WelcomeEmailData,
} from "../templates/emailTemplates.js";
import logger from "../lib/logger.js";

/**
 * Send welcome email to a new organization
 *
 * @param data - Organization and user data for the email
 * @returns Promise that resolves when email is sent
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  try {
    const htmlContent = getWelcomeEmailTemplate(data);
    const textContent = getWelcomeEmailText(data);

    await sendMail({
      to: data.userEmail,
      subject: `🎉 Bienvenue sur Velvena - ${data.organizationName}`,
      html: htmlContent,
      text: textContent,
    });

    logger.info(
      {
        organizationName: data.organizationName,
        userEmail: data.userEmail,
        slug: data.slug,
      },
      "Welcome email sent successfully"
    );
  } catch (error: any) {
    logger.error(
      {
        err: error,
        organizationName: data.organizationName,
        userEmail: data.userEmail,
      },
      "Failed to send welcome email"
    );

    // Don't throw error - we don't want to block organization creation if email fails
    // Just log the error for monitoring
  }
}
