import nodemailer from "nodemailer";
import pino from "pino";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const smtpHost = process.env.SMTP_HOST || "mail.gandi.net";
const smtpPort = Number.parseInt(process.env.SMTP_PORT ?? "465", 10);
const secureFromEnv = process.env.SMTP_SECURE;
const isSecure = secureFromEnv ? secureFromEnv !== "false" : smtpPort === 465;
const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,
    auth: {
        user: process.env.SMTP_USER ?? "",
        pass: process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS ?? "",
    },
    tls: {
        rejectUnauthorized: true,
    },
    logger: true, // ✅ active les logs internes Nodemailer
    debug: true, // ✅ debug SMTP complet
});
// --- Ajout des logs SMTP visibles dans pm2 logs ---
transporter.on("log", (info) => {
    console.log("📡 [SMTP LOG]", info);
});
transporter.on("error", (err) => {
    console.error("🚨 [SMTP ERROR]", err);
});
// ---------------------------------------------------
export async function sendMail({ to, subject, html, text }) {
    try {
        logger.info({ to, subject }, "📤 Envoi d'email en cours...");
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject,
            html,
            text,
        });
        logger.info({ to, subject, messageId: info.messageId }, "✅ Email envoyé avec succès");
    }
    catch (error) {
        logger.error({ to, subject, err: error }, "❌ Échec de l'envoi d'email");
        throw error;
    }
}
//# sourceMappingURL=mailer.js.map