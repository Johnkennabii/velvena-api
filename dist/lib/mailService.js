import Imap from "imap";
import { simpleParser } from "mailparser";
import pino from "pino";
import { sendMail } from "./mailer.js";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const MAILBOX_MAPPING = {
    INBOX: ["INBOX"],
    Sent: ["Sent", "[Gmail]/Sent Mail", "Sent Items"],
    Trash: ["Trash", "[Gmail]/Trash", "Deleted Items", "Corbeille"],
    Spam: ["Spam", "[Gmail]/Spam", "Junk", "Courrier indésirable"],
};
/**
 * Crée une connexion IMAP
 */
function createImapConnection() {
    return new Imap({
        user: process.env.IMAP_USER || process.env.SMTP_USER || "",
        password: process.env.IMAP_PASSWORD || process.env.SMTP_PASSWORD || "",
        host: process.env.IMAP_HOST || "mail.gandi.net",
        port: Number.parseInt(process.env.IMAP_PORT || "993", 10),
        tls: true,
        tlsOptions: { rejectUnauthorized: true },
    });
}
/**
 * Récupère les emails d'une boîte mail
 */
export async function getEmails(mailboxType = "INBOX", limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        const emails = [];
        imap.once("ready", () => {
            // Cherche la boîte mail correspondante
            findMailbox(imap, mailboxType, (err, mailboxName) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }
                imap.openBox(mailboxName, true, (err, box) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }
                    const total = box.messages.total;
                    if (total === 0) {
                        imap.end();
                        return resolve([]);
                    }
                    // Calcul de la plage de messages à récupérer
                    const start = Math.max(1, total - offset - limit + 1);
                    const end = Math.max(1, total - offset);
                    if (start > end) {
                        imap.end();
                        return resolve([]);
                    }
                    const fetch = imap.seq.fetch(`${start}:${end}`, {
                        bodies: "",
                        struct: true,
                    });
                    fetch.on("message", (msg, seqno) => {
                        let buffer = "";
                        let uid = 0;
                        let flags = [];
                        msg.on("body", (stream) => {
                            stream.on("data", (chunk) => {
                                buffer += chunk.toString("utf8");
                            });
                        });
                        msg.once("attributes", (attrs) => {
                            uid = attrs.uid;
                            flags = attrs.flags || [];
                        });
                        msg.once("end", () => {
                            simpleParser(buffer, (err, parsed) => {
                                if (err || !parsed) {
                                    logger.error({ err, seqno }, "Erreur de parsing email");
                                    return;
                                }
                                emails.push(parseEmailMessage(parsed, uid, flags));
                            });
                        });
                    });
                    fetch.once("error", (err) => {
                        imap.end();
                        reject(err);
                    });
                    fetch.once("end", () => {
                        imap.end();
                    });
                });
            });
        });
        imap.once("error", (err) => {
            logger.error({ err }, "Erreur de connexion IMAP");
            reject(err);
        });
        imap.once("end", () => {
            // Tri par date décroissante (plus récent en premier)
            emails.sort((a, b) => b.date.getTime() - a.date.getTime());
            resolve(emails);
        });
        imap.connect();
    });
}
/**
 * Récupère un email spécifique par son UID
 */
export async function getEmailByUid(uid, mailboxType = "INBOX") {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        let email = null;
        imap.once("ready", () => {
            findMailbox(imap, mailboxType, (err, mailboxName) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }
                imap.openBox(mailboxName, true, (err) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }
                    const fetch = imap.fetch([uid], {
                        bodies: "",
                        struct: true,
                    });
                    fetch.on("message", (msg) => {
                        let buffer = "";
                        let flags = [];
                        msg.on("body", (stream) => {
                            stream.on("data", (chunk) => {
                                buffer += chunk.toString("utf8");
                            });
                        });
                        msg.once("attributes", (attrs) => {
                            flags = attrs.flags || [];
                        });
                        msg.once("end", () => {
                            simpleParser(buffer, (err, parsed) => {
                                if (err || !parsed) {
                                    logger.error({ err, uid }, "Erreur de parsing email");
                                    return;
                                }
                                email = parseEmailMessage(parsed, uid, flags);
                            });
                        });
                    });
                    fetch.once("error", (err) => {
                        imap.end();
                        reject(err);
                    });
                    fetch.once("end", () => {
                        imap.end();
                    });
                });
            });
        });
        imap.once("error", (err) => {
            logger.error({ err }, "Erreur de connexion IMAP");
            reject(err);
        });
        imap.once("end", () => {
            resolve(email);
        });
        imap.connect();
    });
}
/**
 * Supprime un email (le déplace vers la corbeille)
 */
export async function deleteEmail(uid, mailboxType = "INBOX") {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        imap.once("ready", () => {
            findMailbox(imap, mailboxType, (err, sourceMailbox) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }
                findMailbox(imap, "Trash", (err, trashMailbox) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }
                    imap.openBox(sourceMailbox, false, (err) => {
                        if (err) {
                            imap.end();
                            return reject(err);
                        }
                        // Déplace vers la corbeille
                        imap.move([uid], trashMailbox, (err) => {
                            if (err) {
                                imap.end();
                                return reject(err);
                            }
                            logger.info({ uid, from: sourceMailbox, to: trashMailbox }, "Email déplacé vers la corbeille");
                            imap.end();
                        });
                    });
                });
            });
        });
        imap.once("error", (err) => {
            logger.error({ err }, "Erreur de connexion IMAP");
            reject(err);
        });
        imap.once("end", () => {
            resolve();
        });
        imap.connect();
    });
}
/**
 * Supprime définitivement un email
 */
export async function permanentlyDeleteEmail(uid, mailboxType = "INBOX") {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        imap.once("ready", () => {
            findMailbox(imap, mailboxType, (err, mailboxName) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }
                imap.openBox(mailboxName, false, (err) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }
                    // Marque comme supprimé
                    imap.addFlags([uid], ["\\Deleted"], (err) => {
                        if (err) {
                            imap.end();
                            return reject(err);
                        }
                        // Expunge pour supprimer définitivement
                        imap.expunge((err) => {
                            if (err) {
                                imap.end();
                                return reject(err);
                            }
                            logger.info({ uid, mailbox: mailboxName }, "Email supprimé définitivement");
                            imap.end();
                        });
                    });
                });
            });
        });
        imap.once("error", (err) => {
            logger.error({ err }, "Erreur de connexion IMAP");
            reject(err);
        });
        imap.once("end", () => {
            resolve();
        });
        imap.connect();
    });
}
/**
 * Marque un email comme lu
 */
export async function markAsRead(uid, mailboxType = "INBOX") {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        imap.once("ready", () => {
            findMailbox(imap, mailboxType, (err, mailboxName) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }
                imap.openBox(mailboxName, false, (err) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }
                    imap.addFlags([uid], ["\\Seen"], (err) => {
                        if (err) {
                            imap.end();
                            return reject(err);
                        }
                        logger.info({ uid, mailbox: mailboxName }, "Email marqué comme lu");
                        imap.end();
                    });
                });
            });
        });
        imap.once("error", (err) => {
            logger.error({ err }, "Erreur de connexion IMAP");
            reject(err);
        });
        imap.once("end", () => {
            resolve();
        });
        imap.connect();
    });
}
/**
 * Marque un email comme non lu
 */
export async function markAsUnread(uid, mailboxType = "INBOX") {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        imap.once("ready", () => {
            findMailbox(imap, mailboxType, (err, mailboxName) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }
                imap.openBox(mailboxName, false, (err) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }
                    imap.delFlags([uid], ["\\Seen"], (err) => {
                        if (err) {
                            imap.end();
                            return reject(err);
                        }
                        logger.info({ uid, mailbox: mailboxName }, "Email marqué comme non lu");
                        imap.end();
                    });
                });
            });
        });
        imap.once("error", (err) => {
            logger.error({ err }, "Erreur de connexion IMAP");
            reject(err);
        });
        imap.once("end", () => {
            resolve();
        });
        imap.connect();
    });
}
/**
 * Récupère les informations sur les boîtes mail
 */
export async function getMailboxes() {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        const mailboxes = [];
        imap.once("ready", () => {
            imap.getBoxes((err, boxes) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }
                const boxNames = Object.keys(boxes);
                let processed = 0;
                if (boxNames.length === 0) {
                    imap.end();
                    return resolve([]);
                }
                for (const boxName of boxNames) {
                    imap.openBox(boxName, true, (err, box) => {
                        processed++;
                        if (!err && box) {
                            mailboxes.push({
                                name: boxName,
                                displayName: getDisplayName(boxName),
                                total: box.messages.total,
                                new: box.messages.new,
                            });
                        }
                        if (processed === boxNames.length) {
                            imap.end();
                        }
                    });
                }
            });
        });
        imap.once("error", (err) => {
            logger.error({ err }, "Erreur de connexion IMAP");
            reject(err);
        });
        imap.once("end", () => {
            resolve(mailboxes);
        });
        imap.connect();
    });
}
/**
 * Envoie un email
 */
export async function sendEmail(to, subject, html, text) {
    const toAddress = Array.isArray(to) ? to.join(", ") : to;
    const mailOptions = {
        to: toAddress,
        subject,
    };
    if (html) {
        mailOptions.html = html;
    }
    if (text) {
        mailOptions.text = text;
    }
    await sendMail(mailOptions);
}
// ============================================
// Fonctions utilitaires
// ============================================
/**
 * Parse un message email en EmailMessage
 */
function parseEmailMessage(parsed, uid, flags) {
    // Gestion du type AddressObject qui peut être un tableau
    let fromAddresses = [];
    let toAddresses = [];
    if (parsed.from) {
        const fromValue = parsed.from;
        if (fromValue.value) {
            fromAddresses = Array.isArray(fromValue.value) ? fromValue.value : [fromValue.value];
        }
        else if (Array.isArray(fromValue)) {
            fromAddresses = fromValue;
        }
        else {
            fromAddresses = [fromValue];
        }
    }
    if (parsed.to) {
        const toValue = parsed.to;
        if (toValue.value) {
            toAddresses = Array.isArray(toValue.value) ? toValue.value : [toValue.value];
        }
        else if (Array.isArray(toValue)) {
            toAddresses = toValue;
        }
        else {
            toAddresses = [toValue];
        }
    }
    const result = {
        id: parsed.messageId || `${uid}`,
        uid,
        subject: parsed.subject || "(Aucun sujet)",
        from: fromAddresses.map((addr) => ({
            address: addr.address || "",
            name: addr.name || "",
        })),
        to: toAddresses.map((addr) => ({
            address: addr.address || "",
            name: addr.name || "",
        })),
        date: parsed.date || new Date(),
        attachments: parsed.attachments?.map((att) => ({
            filename: att.filename || "sans-nom",
            contentType: att.contentType,
            size: att.size,
            content: att.content,
        })) || [],
        flags,
        hasAttachments: (parsed.attachments?.length || 0) > 0,
    };
    // N'ajoute les propriétés optionnelles que si elles existent
    if (parsed.html) {
        result.html = String(parsed.html);
    }
    if (parsed.text) {
        result.text = String(parsed.text);
    }
    return result;
}
/**
 * Trouve la boîte mail correspondante au type demandé
 */
function findMailbox(imap, mailboxType, callback) {
    imap.getBoxes((err, boxes) => {
        if (err) {
            return callback(err, "");
        }
        const boxNames = Object.keys(boxes);
        const possibleNames = MAILBOX_MAPPING[mailboxType];
        // Cherche une correspondance exacte
        for (const possibleName of possibleNames) {
            if (boxNames.includes(possibleName)) {
                return callback(null, possibleName);
            }
        }
        // Cherche une correspondance insensible à la casse
        for (const possibleName of possibleNames) {
            const found = boxNames.find((name) => name.toLowerCase() === possibleName.toLowerCase());
            if (found) {
                return callback(null, found);
            }
        }
        // Par défaut, utilise INBOX ou la première boîte disponible
        const defaultBox = boxNames.includes("INBOX")
            ? "INBOX"
            : boxNames[0] || "INBOX";
        callback(null, defaultBox);
    });
}
/**
 * Retourne un nom d'affichage pour une boîte mail
 */
function getDisplayName(mailboxName) {
    const mapping = {
        INBOX: "Boîte de réception",
        Sent: "Envoyés",
        "Sent Items": "Envoyés",
        "[Gmail]/Sent Mail": "Envoyés",
        Trash: "Corbeille",
        "[Gmail]/Trash": "Corbeille",
        "Deleted Items": "Corbeille",
        Corbeille: "Corbeille",
        Spam: "Courrier indésirable",
        "[Gmail]/Spam": "Courrier indésirable",
        Junk: "Courrier indésirable",
        "Courrier indésirable": "Courrier indésirable",
        Drafts: "Brouillons",
        "[Gmail]/Drafts": "Brouillons",
    };
    return mapping[mailboxName] || mailboxName;
}
//# sourceMappingURL=mailService.js.map