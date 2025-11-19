import { getEmails, getEmailByUid, deleteEmail, permanentlyDeleteEmail, markAsRead, markAsUnread, getMailboxes, sendEmail, } from "../../lib/mailService.js";
import pino from "pino";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
/**
 * Récupère les emails d'une boîte mail
 * GET /mails/:mailbox?limit=50&offset=0
 */
export async function getMailsFromMailbox(req, res) {
    try {
        const mailboxType = (req.params.mailbox || "INBOX").toUpperCase();
        const limit = Number.parseInt(req.query.limit, 10) || 50;
        const offset = Number.parseInt(req.query.offset, 10) || 0;
        // Validation du type de boîte mail
        const validMailboxTypes = ["INBOX", "Sent", "Trash", "Spam"];
        if (!validMailboxTypes.includes(mailboxType)) {
            res.status(400).json({
                success: false,
                error: "Type de boîte mail invalide. Valeurs acceptées : INBOX, Sent, Trash, Spam",
            });
            return;
        }
        logger.info({ mailboxType, limit, offset }, "Récupération des emails");
        const emails = await getEmails(mailboxType, limit, offset);
        res.status(200).json({
            success: true,
            data: emails,
            pagination: {
                limit,
                offset,
                count: emails.length,
            },
        });
    }
    catch (error) {
        logger.error({ error }, "Erreur lors de la récupération des emails");
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des emails",
            details: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
}
/**
 * Récupère un email spécifique par son UID
 * GET /mails/:mailbox/:uid
 */
export async function getMailById(req, res) {
    try {
        const mailboxType = (req.params.mailbox || "INBOX").toUpperCase();
        const uidParam = req.params.uid;
        if (!uidParam) {
            res.status(400).json({
                success: false,
                error: "UID requis",
            });
            return;
        }
        const uid = Number.parseInt(uidParam, 10);
        if (isNaN(uid)) {
            res.status(400).json({
                success: false,
                error: "UID invalide",
            });
            return;
        }
        logger.info({ mailboxType, uid }, "Récupération d'un email");
        const email = await getEmailByUid(uid, mailboxType);
        if (!email) {
            res.status(404).json({
                success: false,
                error: "Email non trouvé",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: email,
        });
    }
    catch (error) {
        logger.error({ error }, "Erreur lors de la récupération de l'email");
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération de l'email",
            details: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
}
/**
 * Supprime un email (le déplace vers la corbeille)
 * DELETE /mails/:mailbox/:uid
 */
export async function deleteMail(req, res) {
    try {
        const mailboxType = (req.params.mailbox || "INBOX").toUpperCase();
        const uidParam = req.params.uid;
        if (!uidParam) {
            res.status(400).json({
                success: false,
                error: "UID requis",
            });
            return;
        }
        const uid = Number.parseInt(uidParam, 10);
        if (isNaN(uid)) {
            res.status(400).json({
                success: false,
                error: "UID invalide",
            });
            return;
        }
        logger.info({ mailboxType, uid }, "Suppression d'un email");
        await deleteEmail(uid, mailboxType);
        res.status(200).json({
            success: true,
            message: "Email déplacé vers la corbeille",
        });
    }
    catch (error) {
        logger.error({ error }, "Erreur lors de la suppression de l'email");
        res.status(500).json({
            success: false,
            error: "Erreur lors de la suppression de l'email",
            details: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
}
/**
 * Supprime définitivement un email
 * DELETE /mails/:mailbox/:uid/permanent
 */
export async function permanentlyDeleteMail(req, res) {
    try {
        const mailboxType = (req.params.mailbox || "INBOX").toUpperCase();
        const uidParam = req.params.uid;
        if (!uidParam) {
            res.status(400).json({
                success: false,
                error: "UID requis",
            });
            return;
        }
        const uid = Number.parseInt(uidParam, 10);
        if (isNaN(uid)) {
            res.status(400).json({
                success: false,
                error: "UID invalide",
            });
            return;
        }
        logger.info({ mailboxType, uid }, "Suppression définitive d'un email");
        await permanentlyDeleteEmail(uid, mailboxType);
        res.status(200).json({
            success: true,
            message: "Email supprimé définitivement",
        });
    }
    catch (error) {
        logger.error({ error }, "Erreur lors de la suppression définitive de l'email");
        res.status(500).json({
            success: false,
            error: "Erreur lors de la suppression définitive de l'email",
            details: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
}
/**
 * Marque un email comme lu
 * PATCH /mails/:mailbox/:uid/read
 */
export async function markMailAsRead(req, res) {
    try {
        const mailboxType = (req.params.mailbox || "INBOX").toUpperCase();
        const uidParam = req.params.uid;
        if (!uidParam) {
            res.status(400).json({
                success: false,
                error: "UID requis",
            });
            return;
        }
        const uid = Number.parseInt(uidParam, 10);
        if (isNaN(uid)) {
            res.status(400).json({
                success: false,
                error: "UID invalide",
            });
            return;
        }
        logger.info({ mailboxType, uid }, "Marquage d'un email comme lu");
        await markAsRead(uid, mailboxType);
        res.status(200).json({
            success: true,
            message: "Email marqué comme lu",
        });
    }
    catch (error) {
        logger.error({ error }, "Erreur lors du marquage de l'email comme lu");
        res.status(500).json({
            success: false,
            error: "Erreur lors du marquage de l'email comme lu",
            details: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
}
/**
 * Marque un email comme non lu
 * PATCH /mails/:mailbox/:uid/unread
 */
export async function markMailAsUnread(req, res) {
    try {
        const mailboxType = (req.params.mailbox || "INBOX").toUpperCase();
        const uidParam = req.params.uid;
        if (!uidParam) {
            res.status(400).json({
                success: false,
                error: "UID requis",
            });
            return;
        }
        const uid = Number.parseInt(uidParam, 10);
        if (isNaN(uid)) {
            res.status(400).json({
                success: false,
                error: "UID invalide",
            });
            return;
        }
        logger.info({ mailboxType, uid }, "Marquage d'un email comme non lu");
        await markAsUnread(uid, mailboxType);
        res.status(200).json({
            success: true,
            message: "Email marqué comme non lu",
        });
    }
    catch (error) {
        logger.error({ error }, "Erreur lors du marquage de l'email comme non lu");
        res.status(500).json({
            success: false,
            error: "Erreur lors du marquage de l'email comme non lu",
            details: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
}
/**
 * Récupère la liste des boîtes mail
 * GET /mails/mailboxes
 */
export async function listMailboxes(req, res) {
    try {
        logger.info("Récupération de la liste des boîtes mail");
        const mailboxes = await getMailboxes();
        res.status(200).json({
            success: true,
            data: mailboxes,
        });
    }
    catch (error) {
        logger.error({ error }, "Erreur lors de la récupération des boîtes mail");
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des boîtes mail",
            details: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
}
/**
 * Envoie un email
 * POST /mails/send
 */
export async function sendMail(req, res) {
    try {
        const { to, subject, html, text } = req.body;
        // Validation
        if (!to || !subject) {
            res.status(400).json({
                success: false,
                error: "Les champs 'to' et 'subject' sont requis",
            });
            return;
        }
        if (!html && !text) {
            res.status(400).json({
                success: false,
                error: "Au moins un des champs 'html' ou 'text' est requis",
            });
            return;
        }
        logger.info({ to, subject }, "Envoi d'un email");
        await sendEmail(to, subject, html, text);
        res.status(200).json({
            success: true,
            message: "Email envoyé avec succès",
        });
    }
    catch (error) {
        logger.error({ error }, "Erreur lors de l'envoi de l'email");
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'envoi de l'email",
            details: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
}
//# sourceMappingURL=mailController.js.map