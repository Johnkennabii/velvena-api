import { getEmails, getEmailByUid, deleteEmail, permanentlyDeleteEmail, markAsRead, markAsUnread, getMailboxes, sendEmail, addFlag, removeFlag, moveEmail, } from "../../lib/mailService.js";
import pino from "pino";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
/**
 * Normalise le nom d'une boîte mail
 */
function normalizeMailboxType(mailbox) {
    const normalized = mailbox.toLowerCase();
    switch (normalized) {
        case "inbox":
            return "INBOX";
        case "sent":
            return "Sent";
        case "trash":
            return "Trash";
        case "spam":
        case "junk":
            return "Spam";
        default:
            return null;
    }
}
/**
 * Récupère les emails d'une boîte mail
 * GET /mails/:mailbox?limit=50&offset=0
 */
export async function getMailsFromMailbox(req, res) {
    try {
        const mailboxParam = req.params.mailbox || "inbox";
        const mailboxType = normalizeMailboxType(mailboxParam);
        const limit = Number.parseInt(req.query.limit, 10) || 50;
        const offset = Number.parseInt(req.query.offset, 10) || 0;
        // Validation du type de boîte mail
        if (!mailboxType) {
            res.status(400).json({
                success: false,
                error: "Type de boîte mail invalide. Valeurs acceptées : inbox, sent, trash, spam, junk",
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
        const mailboxParam = req.params.mailbox || "inbox";
        const mailboxType = normalizeMailboxType(mailboxParam);
        const uidParam = req.params.uid;
        if (!mailboxType) {
            res.status(400).json({
                success: false,
                error: "Type de boîte mail invalide",
            });
            return;
        }
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
        const mailboxParam = req.params.mailbox || "inbox";
        const mailboxType = normalizeMailboxType(mailboxParam);
        const uidParam = req.params.uid;
        if (!mailboxType) {
            res.status(400).json({
                success: false,
                error: "Type de boîte mail invalide",
            });
            return;
        }
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
        const mailboxParam = req.params.mailbox || "inbox";
        const mailboxType = normalizeMailboxType(mailboxParam);
        const uidParam = req.params.uid;
        if (!mailboxType) {
            res.status(400).json({
                success: false,
                error: "Type de boîte mail invalide",
            });
            return;
        }
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
        const mailboxParam = req.params.mailbox || "inbox";
        const mailboxType = normalizeMailboxType(mailboxParam);
        const uidParam = req.params.uid;
        if (!mailboxType) {
            res.status(400).json({
                success: false,
                error: "Type de boîte mail invalide",
            });
            return;
        }
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
        const mailboxParam = req.params.mailbox || "inbox";
        const mailboxType = normalizeMailboxType(mailboxParam);
        const uidParam = req.params.uid;
        if (!mailboxType) {
            res.status(400).json({
                success: false,
                error: "Type de boîte mail invalide",
            });
            return;
        }
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
/**
 * Ajoute un flag à un email
 * PATCH /mails/:mailbox/:uid/flag/add
 */
export async function addMailFlag(req, res) {
    try {
        const mailboxParam = req.params.mailbox || "inbox";
        const mailboxType = normalizeMailboxType(mailboxParam);
        const uidParam = req.params.uid;
        const { flag } = req.body;
        if (!mailboxType) {
            res.status(400).json({
                success: false,
                error: "Type de boîte mail invalide",
            });
            return;
        }
        if (!uidParam) {
            res.status(400).json({
                success: false,
                error: "UID requis",
            });
            return;
        }
        if (!flag) {
            res.status(400).json({
                success: false,
                error: "Flag requis (ex: \\Flagged, \\Answered)",
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
        logger.info({ mailboxType, uid, flag }, "Ajout d'un flag à l'email");
        await addFlag(uid, flag, mailboxType);
        res.status(200).json({
            success: true,
            message: `Flag ${flag} ajouté avec succès`,
        });
    }
    catch (error) {
        logger.error({ error }, "Erreur lors de l'ajout du flag");
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'ajout du flag",
            details: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
}
/**
 * Retire un flag d'un email
 * PATCH /mails/:mailbox/:uid/flag/remove
 */
export async function removeMailFlag(req, res) {
    try {
        const mailboxParam = req.params.mailbox || "inbox";
        const mailboxType = normalizeMailboxType(mailboxParam);
        const uidParam = req.params.uid;
        const { flag } = req.body;
        if (!mailboxType) {
            res.status(400).json({
                success: false,
                error: "Type de boîte mail invalide",
            });
            return;
        }
        if (!uidParam) {
            res.status(400).json({
                success: false,
                error: "UID requis",
            });
            return;
        }
        if (!flag) {
            res.status(400).json({
                success: false,
                error: "Flag requis (ex: \\Flagged, \\Answered)",
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
        logger.info({ mailboxType, uid, flag }, "Retrait d'un flag de l'email");
        await removeFlag(uid, flag, mailboxType);
        res.status(200).json({
            success: true,
            message: `Flag ${flag} retiré avec succès`,
        });
    }
    catch (error) {
        logger.error({ error }, "Erreur lors du retrait du flag");
        res.status(500).json({
            success: false,
            error: "Erreur lors du retrait du flag",
            details: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
}
/**
 * Déplace un email d'un dossier à un autre
 * PATCH /mails/:mailbox/:uid/move
 */
export async function moveMailToFolder(req, res) {
    try {
        const fromMailboxParam = req.params.mailbox || "inbox";
        const fromMailboxType = normalizeMailboxType(fromMailboxParam);
        const uidParam = req.params.uid;
        const { toMailbox } = req.body;
        if (!fromMailboxType) {
            res.status(400).json({
                success: false,
                error: "Type de boîte mail source invalide",
            });
            return;
        }
        if (!uidParam) {
            res.status(400).json({
                success: false,
                error: "UID requis",
            });
            return;
        }
        if (!toMailbox) {
            res.status(400).json({
                success: false,
                error: "Boîte mail de destination requise (toMailbox)",
            });
            return;
        }
        const toMailboxType = normalizeMailboxType(toMailbox);
        if (!toMailboxType) {
            res.status(400).json({
                success: false,
                error: "Type de boîte mail destination invalide",
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
        logger.info({ fromMailboxType, toMailboxType, uid }, "Déplacement d'un email");
        await moveEmail(uid, fromMailboxType, toMailboxType);
        res.status(200).json({
            success: true,
            message: `Email déplacé de ${fromMailboxType} vers ${toMailboxType}`,
        });
    }
    catch (error) {
        logger.error({ error }, "Erreur lors du déplacement de l'email");
        res.status(500).json({
            success: false,
            error: "Erreur lors du déplacement de l'email",
            details: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
}
//# sourceMappingURL=mailController.js.map