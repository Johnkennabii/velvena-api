import Imap from "imap";
import { simpleParser } from "mailparser";
import pino from "pino";
import { sendMail } from "./mailer.js";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const MAILBOX_MAPPING = {
    INBOX: ["INBOX"],
    Sent: ["Sent", "[Gmail]/Sent Mail", "Sent Items"],
    Trash: ["Trash", "[Gmail]/Trash", "Deleted Items", "Corbeille"],
    Spam: ["Junk", "Spam", "[Gmail]/Spam", "Courrier indésirable"],
    Drafts: ["Drafts", "[Gmail]/Drafts", "Brouillons"],
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
        tlsOptions: {
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2'
        },
        authTimeout: 10000, // 10 secondes pour l'authentification
        connTimeout: 10000, // 10 secondes pour la connexion
        keepalive: false,
    });
}
/**
 * Récupère les emails d'une boîte mail
 */
export async function getEmails(mailboxType = "INBOX", limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        const emails = [];
        let timeoutId;
        // Timeout de 45 secondes
        timeoutId = setTimeout(() => {
            try {
                imap.destroy();
            }
            catch (e) {
                // Ignore
            }
            reject(new Error("Timeout lors de la récupération des emails"));
        }, 45000);
        imap.once("ready", () => {
            // Cherche la boîte mail correspondante
            findMailbox(imap, mailboxType, (err, mailboxName) => {
                if (err) {
                    clearTimeout(timeoutId);
                    try {
                        imap.end();
                    }
                    catch (e) {
                        // Ignore
                    }
                    return reject(err);
                }
                imap.openBox(mailboxName, true, (err, box) => {
                    if (err) {
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) {
                            // Ignore
                        }
                        return reject(err);
                    }
                    const total = box.messages.total;
                    if (total === 0) {
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) {
                            // Ignore
                        }
                        return resolve([]);
                    }
                    // Calcul de la plage de messages à récupérer
                    const start = Math.max(1, total - offset - limit + 1);
                    const end = Math.max(1, total - offset);
                    if (start > end) {
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) {
                            // Ignore
                        }
                        return resolve([]);
                    }
                    const expectedMessages = end - start + 1;
                    let processedMessages = 0;
                    let fetchEnded = false;
                    const checkComplete = () => {
                        if (fetchEnded && processedMessages === expectedMessages) {
                            clearTimeout(timeoutId);
                            // Tri par date décroissante (plus récent en premier)
                            emails.sort((a, b) => b.date.getTime() - a.date.getTime());
                            try {
                                imap.end();
                            }
                            catch (e) {
                                // Ignore
                            }
                            resolve(emails);
                        }
                    };
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
                                processedMessages++;
                                if (!err && parsed) {
                                    emails.push(parseEmailMessage(parsed, uid, flags));
                                }
                                else {
                                    logger.error({ err, seqno }, "Erreur de parsing email");
                                }
                                checkComplete();
                            });
                        });
                    });
                    fetch.once("error", (err) => {
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) {
                            // Ignore
                        }
                        reject(err);
                    });
                    fetch.once("end", () => {
                        fetchEnded = true;
                        checkComplete();
                    });
                });
            });
        });
        imap.once("error", (err) => {
            clearTimeout(timeoutId);
            logger.error({ err }, "Erreur de connexion IMAP");
            try {
                imap.destroy();
            }
            catch (e) {
                // Ignore
            }
            reject(err);
        });
        try {
            imap.connect();
        }
        catch (err) {
            clearTimeout(timeoutId);
            reject(err);
        }
    });
}
/**
 * Récupère un email spécifique par son UID avec TOUS les détails (HTML, texte, pièces jointes)
 */
export async function getEmailByUid(uid, mailboxType = "INBOX") {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        let email = null;
        let timeoutId;
        // Timeout de 30 secondes
        timeoutId = setTimeout(() => {
            try {
                imap.destroy();
            }
            catch (e) {
                // Ignore
            }
            reject(new Error("Timeout lors de la récupération de l'email"));
        }, 30000);
        imap.once("ready", () => {
            findMailbox(imap, mailboxType, (err, mailboxName) => {
                if (err) {
                    clearTimeout(timeoutId);
                    try {
                        imap.end();
                    }
                    catch (e) { }
                    return reject(err);
                }
                imap.openBox(mailboxName, true, (err) => {
                    if (err) {
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) { }
                        return reject(err);
                    }
                    const fetch = imap.fetch([uid], {
                        bodies: "", // Récupère le corps complet
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
                                    clearTimeout(timeoutId);
                                    try {
                                        imap.end();
                                    }
                                    catch (e) { }
                                    return reject(err || new Error("Parsing failed"));
                                }
                                email = parseEmailMessage(parsed, uid, flags);
                                logger.info({ uid, hasHtml: !!email.html, hasText: !!email.text }, "Email complet récupéré");
                            });
                        });
                    });
                    fetch.once("error", (err) => {
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) { }
                        reject(err);
                    });
                    fetch.once("end", () => {
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) { }
                    });
                });
            });
        });
        imap.once("error", (err) => {
            clearTimeout(timeoutId);
            logger.error({ err }, "Erreur de connexion IMAP");
            try {
                imap.destroy();
            }
            catch (e) { }
            reject(err);
        });
        imap.once("end", () => {
            resolve(email);
        });
        try {
            imap.connect();
        }
        catch (err) {
            clearTimeout(timeoutId);
            reject(err);
        }
    });
}
/**
 * Supprime un email (le déplace vers la corbeille)
 */
export async function deleteEmail(uid, mailboxType = "INBOX") {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        let timeoutId;
        // Timeout de 30 secondes
        timeoutId = setTimeout(() => {
            try {
                imap.destroy();
            }
            catch (e) {
                // Ignore
            }
            reject(new Error("Timeout lors de la suppression de l'email"));
        }, 30000);
        imap.once("ready", () => {
            findMailbox(imap, mailboxType, (err, sourceMailbox) => {
                if (err) {
                    clearTimeout(timeoutId);
                    try {
                        imap.end();
                    }
                    catch (e) { }
                    return reject(err);
                }
                findMailbox(imap, "Trash", (err, trashMailbox) => {
                    if (err) {
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) { }
                        return reject(err);
                    }
                    imap.openBox(sourceMailbox, false, (err) => {
                        if (err) {
                            clearTimeout(timeoutId);
                            try {
                                imap.end();
                            }
                            catch (e) { }
                            return reject(err);
                        }
                        // Déplace vers la corbeille
                        imap.move([uid], trashMailbox, (err) => {
                            clearTimeout(timeoutId);
                            if (err) {
                                try {
                                    imap.end();
                                }
                                catch (e) { }
                                return reject(err);
                            }
                            logger.info({ uid, from: sourceMailbox, to: trashMailbox }, "Email déplacé vers la corbeille");
                            try {
                                imap.end();
                            }
                            catch (e) { }
                            // Résoudre immédiatement après le move
                            resolve();
                        });
                    });
                });
            });
        });
        imap.once("error", (err) => {
            clearTimeout(timeoutId);
            logger.error({ err }, "Erreur de connexion IMAP");
            try {
                imap.destroy();
            }
            catch (e) { }
            reject(err);
        });
        try {
            imap.connect();
        }
        catch (err) {
            clearTimeout(timeoutId);
            reject(err);
        }
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
        let timeoutId;
        // Timeout de 30 secondes pour l'opération complète (plus long car on ouvre chaque boîte)
        timeoutId = setTimeout(() => {
            try {
                imap.destroy();
            }
            catch (e) {
                // Ignore les erreurs de destroy
            }
            reject(new Error("Timeout lors de la récupération des boîtes mail"));
        }, 30000);
        imap.once("ready", () => {
            imap.getBoxes((err, boxes) => {
                if (err) {
                    clearTimeout(timeoutId);
                    logger.error({ err }, "Erreur lors de getBoxes");
                    try {
                        imap.end();
                    }
                    catch (e) { }
                    return reject(err);
                }
                const boxNames = Object.keys(boxes);
                // Boîtes principales à chercher (en respectant les noms Gandi)
                const mainBoxNames = ["INBOX", "Sent", "Trash", "Junk", "Drafts"];
                const mainMailboxes = [];
                // Liste des boîtes existantes à ouvrir
                const boxesToOpen = [];
                for (const mainName of mainBoxNames) {
                    const foundBox = boxNames.find(name => name.toLowerCase() === mainName.toLowerCase());
                    if (foundBox && boxes[foundBox]) {
                        boxesToOpen.push(foundBox);
                    }
                }
                // Fonction pour ouvrir chaque boîte et récupérer les comptes
                let processedBoxes = 0;
                const openNextBox = (index) => {
                    if (index >= boxesToOpen.length) {
                        // Toutes les boîtes ont été traitées
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) { }
                        resolve(mainMailboxes);
                        return;
                    }
                    const boxName = boxesToOpen[index]; // Non-null assertion car on a vérifié index < length
                    imap.openBox(boxName, true, (openErr, box) => {
                        if (openErr) {
                            logger.warn({ boxName, err: openErr }, "Erreur lors de l'ouverture de la boîte");
                            // Ajoute la boîte avec des comptes à 0 en cas d'erreur
                            mainMailboxes.push({
                                name: boxName,
                                displayName: getDisplayName(boxName),
                                total: 0,
                                new: 0,
                            });
                            processedBoxes++;
                            openNextBox(index + 1);
                        }
                        else {
                            const total = box.messages.total || 0;
                            // Recherche les messages non lus (UNSEEN)
                            if (total === 0) {
                                mainMailboxes.push({
                                    name: boxName,
                                    displayName: getDisplayName(boxName),
                                    total: 0,
                                    new: 0,
                                });
                                processedBoxes++;
                                openNextBox(index + 1);
                            }
                            else {
                                imap.search(['UNSEEN'], (searchErr, unseenUids) => {
                                    if (searchErr) {
                                        logger.warn({ boxName, err: searchErr }, "Erreur lors de la recherche UNSEEN");
                                        // En cas d'erreur, on met 0 pour les non lus
                                        mainMailboxes.push({
                                            name: boxName,
                                            displayName: getDisplayName(boxName),
                                            total,
                                            new: 0,
                                        });
                                    }
                                    else {
                                        // Nombre réel de messages non lus
                                        mainMailboxes.push({
                                            name: boxName,
                                            displayName: getDisplayName(boxName),
                                            total,
                                            new: unseenUids.length,
                                        });
                                    }
                                    processedBoxes++;
                                    openNextBox(index + 1);
                                });
                            }
                        }
                    });
                };
                // Commence le traitement
                openNextBox(0);
            });
        });
        imap.once("error", (err) => {
            clearTimeout(timeoutId);
            logger.error({ err }, "Erreur de connexion IMAP");
            try {
                imap.destroy();
            }
            catch (e) {
                // Ignore
            }
            reject(err);
        });
        try {
            imap.connect();
        }
        catch (err) {
            clearTimeout(timeoutId);
            reject(err);
        }
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
/**
 * Ajoute un flag à un email
 * Flags IMAP standards: \Seen, \Answered, \Flagged, \Deleted, \Draft
 */
export async function addFlag(uid, flag, mailboxType = "INBOX") {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        let timeoutId;
        timeoutId = setTimeout(() => {
            try {
                imap.destroy();
            }
            catch (e) { }
            reject(new Error("Timeout lors de l'ajout du flag"));
        }, 30000);
        imap.once("ready", () => {
            findMailbox(imap, mailboxType, (err, mailboxName) => {
                if (err) {
                    clearTimeout(timeoutId);
                    try {
                        imap.end();
                    }
                    catch (e) { }
                    return reject(err);
                }
                imap.openBox(mailboxName, false, (err) => {
                    if (err) {
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) { }
                        return reject(err);
                    }
                    imap.addFlags([uid], [flag], (err) => {
                        clearTimeout(timeoutId);
                        if (err) {
                            try {
                                imap.end();
                            }
                            catch (e) { }
                            return reject(err);
                        }
                        logger.info({ uid, flag, mailbox: mailboxName }, "Flag ajouté à l'email");
                        try {
                            imap.end();
                        }
                        catch (e) { }
                    });
                });
            });
        });
        imap.once("error", (err) => {
            clearTimeout(timeoutId);
            logger.error({ err }, "Erreur de connexion IMAP");
            try {
                imap.destroy();
            }
            catch (e) { }
            reject(err);
        });
        imap.once("end", () => {
            resolve();
        });
        try {
            imap.connect();
        }
        catch (err) {
            clearTimeout(timeoutId);
            reject(err);
        }
    });
}
/**
 * Retire un flag d'un email
 */
export async function removeFlag(uid, flag, mailboxType = "INBOX") {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        let timeoutId;
        timeoutId = setTimeout(() => {
            try {
                imap.destroy();
            }
            catch (e) { }
            reject(new Error("Timeout lors du retrait du flag"));
        }, 30000);
        imap.once("ready", () => {
            findMailbox(imap, mailboxType, (err, mailboxName) => {
                if (err) {
                    clearTimeout(timeoutId);
                    try {
                        imap.end();
                    }
                    catch (e) { }
                    return reject(err);
                }
                imap.openBox(mailboxName, false, (err) => {
                    if (err) {
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) { }
                        return reject(err);
                    }
                    imap.delFlags([uid], [flag], (err) => {
                        clearTimeout(timeoutId);
                        if (err) {
                            try {
                                imap.end();
                            }
                            catch (e) { }
                            return reject(err);
                        }
                        logger.info({ uid, flag, mailbox: mailboxName }, "Flag retiré de l'email");
                        try {
                            imap.end();
                        }
                        catch (e) { }
                    });
                });
            });
        });
        imap.once("error", (err) => {
            clearTimeout(timeoutId);
            logger.error({ err }, "Erreur de connexion IMAP");
            try {
                imap.destroy();
            }
            catch (e) { }
            reject(err);
        });
        imap.once("end", () => {
            resolve();
        });
        try {
            imap.connect();
        }
        catch (err) {
            clearTimeout(timeoutId);
            reject(err);
        }
    });
}
/**
 * Récupère une pièce jointe spécifique d'un email par son index
 */
export async function getEmailAttachment(uid, attachmentIndex, mailboxType = "INBOX") {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        let timeoutId;
        timeoutId = setTimeout(() => {
            try {
                imap.destroy();
            }
            catch (e) { }
            reject(new Error("Timeout lors de la récupération de la pièce jointe"));
        }, 30000);
        imap.once("ready", () => {
            findMailbox(imap, mailboxType, (err, mailboxName) => {
                if (err) {
                    clearTimeout(timeoutId);
                    try {
                        imap.end();
                    }
                    catch (e) { }
                    return reject(err);
                }
                imap.openBox(mailboxName, true, (err) => {
                    if (err) {
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) { }
                        return reject(err);
                    }
                    const fetch = imap.fetch([uid], {
                        bodies: "",
                        struct: true,
                    });
                    fetch.on("message", (msg) => {
                        let buffer = "";
                        msg.on("body", (stream) => {
                            stream.on("data", (chunk) => {
                                buffer += chunk.toString("utf8");
                            });
                        });
                        msg.once("end", () => {
                            simpleParser(buffer, (err, parsed) => {
                                clearTimeout(timeoutId);
                                if (err || !parsed) {
                                    logger.error({ err, uid }, "Erreur de parsing email pour PJ");
                                    try {
                                        imap.end();
                                    }
                                    catch (e) { }
                                    return reject(err || new Error("Parsing failed"));
                                }
                                const attachments = parsed.attachments || [];
                                if (attachmentIndex < 0 || attachmentIndex >= attachments.length) {
                                    logger.warn({ uid, attachmentIndex, total: attachments.length }, "Index de PJ invalide");
                                    try {
                                        imap.end();
                                    }
                                    catch (e) { }
                                    return resolve(null);
                                }
                                const attachment = attachments[attachmentIndex];
                                if (!attachment) {
                                    logger.warn({ uid, attachmentIndex }, "Pièce jointe non trouvée");
                                    try {
                                        imap.end();
                                    }
                                    catch (e) { }
                                    return resolve(null);
                                }
                                logger.info({ uid, filename: attachment.filename, size: attachment.size }, "Pièce jointe récupérée");
                                try {
                                    imap.end();
                                }
                                catch (e) { }
                                resolve({
                                    filename: attachment.filename || "attachment",
                                    contentType: attachment.contentType,
                                    content: attachment.content,
                                });
                            });
                        });
                    });
                    fetch.once("error", (err) => {
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) { }
                        reject(err);
                    });
                });
            });
        });
        imap.once("error", (err) => {
            clearTimeout(timeoutId);
            logger.error({ err }, "Erreur de connexion IMAP");
            try {
                imap.destroy();
            }
            catch (e) { }
            reject(err);
        });
        imap.once("end", () => {
            // Résolution déjà gérée dans le fetch
        });
        try {
            imap.connect();
        }
        catch (err) {
            clearTimeout(timeoutId);
            reject(err);
        }
    });
}
/**
 * Déplace un email d'une boîte mail vers une autre
 */
export async function moveEmail(uid, fromMailboxType, toMailboxType) {
    return new Promise((resolve, reject) => {
        const imap = createImapConnection();
        let timeoutId;
        timeoutId = setTimeout(() => {
            try {
                imap.destroy();
            }
            catch (e) { }
            reject(new Error("Timeout lors du déplacement de l'email"));
        }, 30000);
        imap.once("ready", () => {
            findMailbox(imap, fromMailboxType, (err, sourceMailbox) => {
                if (err) {
                    clearTimeout(timeoutId);
                    try {
                        imap.end();
                    }
                    catch (e) { }
                    return reject(err);
                }
                findMailbox(imap, toMailboxType, (err, targetMailbox) => {
                    if (err) {
                        clearTimeout(timeoutId);
                        try {
                            imap.end();
                        }
                        catch (e) { }
                        return reject(err);
                    }
                    imap.openBox(sourceMailbox, false, (err) => {
                        if (err) {
                            clearTimeout(timeoutId);
                            try {
                                imap.end();
                            }
                            catch (e) { }
                            return reject(err);
                        }
                        imap.move([uid], targetMailbox, (err) => {
                            clearTimeout(timeoutId);
                            if (err) {
                                try {
                                    imap.end();
                                }
                                catch (e) { }
                                return reject(err);
                            }
                            logger.info({ uid, from: sourceMailbox, to: targetMailbox }, "Email déplacé");
                            try {
                                imap.end();
                            }
                            catch (e) { }
                        });
                    });
                });
            });
        });
        imap.once("error", (err) => {
            clearTimeout(timeoutId);
            logger.error({ err }, "Erreur de connexion IMAP");
            try {
                imap.destroy();
            }
            catch (e) { }
            reject(err);
        });
        imap.once("end", () => {
            resolve();
        });
        try {
            imap.connect();
        }
        catch (err) {
            clearTimeout(timeoutId);
            reject(err);
        }
    });
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
        const entries = flattenMailboxEntries(boxes);
        const boxNames = entries.map((entry) => entry.name);
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
        const defaultBox = entries.find((entry) => entry.name === "INBOX" && entry.selectable)?.name ??
            entries.find((entry) => entry.selectable)?.name ??
            "INBOX";
        callback(null, defaultBox);
    });
}
function flattenMailboxEntries(boxes, parent = "", parentDelimiter = "/") {
    const entries = [];
    for (const [name, info] of Object.entries(boxes)) {
        const delimiter = info.delimiter ?? parentDelimiter ?? "/";
        const fullName = parent ? `${parent}${delimiter}${name}` : name;
        const selectable = !(info.attribs || []).includes("\\Noselect");
        entries.push({ name: fullName, selectable });
        if (info.children) {
            entries.push(...flattenMailboxEntries(info.children, fullName, delimiter));
        }
    }
    return entries;
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
        Junk: "Courrier indésirable",
        Spam: "Courrier indésirable",
        "[Gmail]/Spam": "Courrier indésirable",
        "Courrier indésirable": "Courrier indésirable",
        Drafts: "Brouillons",
        "[Gmail]/Drafts": "Brouillons",
        Brouillons: "Brouillons",
    };
    return mapping[mailboxName] || mailboxName;
}
//# sourceMappingURL=mailService.js.map