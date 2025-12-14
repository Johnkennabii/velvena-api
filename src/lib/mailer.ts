import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// Lazy initialization of the transporter to ensure env vars are loaded
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const smtpHost = process.env.SMTP_HOST || "mail.gandi.net";
    const smtpPort = Number.parseInt(process.env.SMTP_PORT ?? "465", 10);
    const secureFromEnv = process.env.SMTP_SECURE;
    const isSecure = secureFromEnv ? secureFromEnv !== "false" : smtpPort === 465;

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER ?? "",
        pass: process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS ?? "",
      },
      tls: {
        rejectUnauthorized: true,
      },
      logger: true, // ✅ active les logs internes Nodemailer
      debug: true,  // ✅ debug SMTP complet
    });
  }
  return transporter;
}

interface MailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

export async function sendMail({ to, cc, bcc, subject, html, text, attachments }: MailOptions): Promise<void> {
  const toList = Array.isArray(to) ? to.join(", ") : to;
  const ccList = cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : undefined;
  const bccList = bcc ? (Array.isArray(bcc) ? bcc.join(", ") : bcc) : undefined;
  const attachmentCount = attachments?.length ?? 0;

  try {
    logger.info({ to: toList, cc: ccList, bcc: bccList, subject, attachments: attachmentCount }, "📤 Envoi d'email en cours...");
    const info = await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: toList,
      cc: ccList,
      bcc: bccList,
      subject,
      html,
      text,
      attachments,
      replyTo: process.env.SMTP_FROM,
      headers: {
        'X-Mailer': 'Allure Création Mailer',
        'X-Priority': '3',
        'Importance': 'Normal',
        'X-MSMail-Priority': 'Normal',
      },
    });
    logger.info({ to: toList, cc: ccList, bcc: bccList, subject, attachments: attachmentCount, messageId: info.messageId }, "✅ Email envoyé avec succès");
  } catch (error) {
    logger.error({ to: toList, cc: ccList, bcc: bccList, subject, attachments: attachmentCount, err: error }, "❌ Échec de l'envoi d'email");
    throw error;
  }
}
