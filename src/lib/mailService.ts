import Imap from "imap";
import { simpleParser } from "mailparser";
import type { ParsedMail } from "mailparser";
import pino from "pino";
import { sendMail } from "./mailer.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

export interface EmailMessage {
  id: string;
  uid: number;
  subject: string;
  from: { address: string; name: string }[];
  to: { address: string; name: string }[];
  date: Date;
  html?: string;
  text?: string;
  attachments: {
    filename: string;
    contentType: string;
    size: number;
    content?: Buffer;
  }[];
  flags: string[];
  hasAttachments: boolean;
}

export interface MailboxInfo {
  name: string;
  displayName: string;
  total: number;
  new: number;
}

export type MailboxType = "INBOX" | "Sent" | "Trash" | "Spam";

const MAILBOX_MAPPING: Record<MailboxType, string[]> = {
  INBOX: ["INBOX"],
  Sent: ["Sent", "[Gmail]/Sent Mail", "Sent Items"],
  Trash: ["Trash", "[Gmail]/Trash", "Deleted Items", "Corbeille"],
  Spam: ["Junk", "Spam", "[Gmail]/Spam", "Courrier indésirable"],
};

/**
 * Crée une connexion IMAP
 */
function createImapConnection(): Imap {
  return new Imap({
    user: process.env.IMAP_USER || process.env.SMTP_USER || "",
    password: process.env.IMAP_PASSWORD || process.env.SMTP_PASSWORD || "",
    host: process.env.IMAP_HOST || "mail.gandi.net",
    port: Number.parseInt(process.env.IMAP_PORT || "993", 10),
    tls: true,
    tlsOptions: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2' as const
    },
    authTimeout: 10000, // 10 secondes pour l'authentification
    connTimeout: 10000, // 10 secondes pour la connexion
    keepalive: false,
  });
}

/**
 * Récupère les emails d'une boîte mail
 */
export async function getEmails(
  mailboxType: MailboxType = "INBOX",
  limit = 50,
  offset = 0
): Promise<EmailMessage[]> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();
    const emails: EmailMessage[] = [];

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
            let flags: string[] = [];

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
              simpleParser(buffer, (err: Error | undefined, parsed: ParsedMail | undefined) => {
                if (err || !parsed) {
                  logger.error({ err, seqno }, "Erreur de parsing email");
                  return;
                }

                emails.push(parseEmailMessage(parsed, uid, flags));
              });
            });
          });

          fetch.once("error", (err: Error) => {
            imap.end();
            reject(err);
          });

          fetch.once("end", () => {
            imap.end();
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
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
export async function getEmailByUid(
  uid: number,
  mailboxType: MailboxType = "INBOX"
): Promise<EmailMessage | null> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();
    let email: EmailMessage | null = null;

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
            let flags: string[] = [];

            msg.on("body", (stream) => {
              stream.on("data", (chunk) => {
                buffer += chunk.toString("utf8");
              });
            });

            msg.once("attributes", (attrs) => {
              flags = attrs.flags || [];
            });

            msg.once("end", () => {
              simpleParser(buffer, (err: Error | undefined, parsed: ParsedMail | undefined) => {
                if (err || !parsed) {
                  logger.error({ err, uid }, "Erreur de parsing email");
                  return;
                }

                email = parseEmailMessage(parsed, uid, flags);
              });
            });
          });

          fetch.once("error", (err: Error) => {
            imap.end();
            reject(err);
          });

          fetch.once("end", () => {
            imap.end();
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
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
export async function deleteEmail(
  uid: number,
  mailboxType: MailboxType = "INBOX"
): Promise<void> {
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

    imap.once("error", (err: Error) => {
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
export async function permanentlyDeleteEmail(
  uid: number,
  mailboxType: MailboxType = "INBOX"
): Promise<void> {
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

    imap.once("error", (err: Error) => {
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
export async function markAsRead(
  uid: number,
  mailboxType: MailboxType = "INBOX"
): Promise<void> {
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

    imap.once("error", (err: Error) => {
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
export async function markAsUnread(
  uid: number,
  mailboxType: MailboxType = "INBOX"
): Promise<void> {
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

    imap.once("error", (err: Error) => {
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
export async function getMailboxes(): Promise<MailboxInfo[]> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();
    let timeoutId: NodeJS.Timeout;

    // Timeout de 15 secondes pour l'opération complète
    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore les erreurs de destroy
      }
      reject(new Error("Timeout lors de la récupération des boîtes mail"));
    }, 15000);

    imap.once("ready", () => {
      imap.getBoxes((err, boxes) => {
        clearTimeout(timeoutId);

        // Ferme immédiatement la connexion
        try {
          imap.end();
        } catch (e) {
          // Ignore
        }

        if (err) {
          logger.error({ err }, "Erreur lors de getBoxes");
          return reject(err);
        }

        const boxNames = Object.keys(boxes);

        // Retourne seulement les boîtes principales sans les ouvrir
        const mainMailboxes: MailboxInfo[] = [];

        // Boîtes principales à chercher (en respectant les noms Gandi)
        const mainBoxNames = ["INBOX", "Sent", "Trash", "Junk", "Drafts"];

        for (const mainName of mainBoxNames) {
          const foundBox = boxNames.find(
            name => name.toLowerCase() === mainName.toLowerCase()
          );

          if (foundBox && boxes[foundBox]) {
            mainMailboxes.push({
              name: foundBox,
              displayName: getDisplayName(foundBox),
              total: 0, // On ne compte pas les messages pour éviter le timeout
              new: 0,
            });
          }
        }

        resolve(mainMailboxes);
      });
    });

    imap.once("error", (err: Error) => {
      clearTimeout(timeoutId);
      logger.error({ err }, "Erreur de connexion IMAP");
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(err);
    });

    try {
      imap.connect();
    } catch (err) {
      clearTimeout(timeoutId);
      reject(err);
    }
  });
}

/**
 * Envoie un email
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html?: string,
  text?: string
): Promise<void> {
  const toAddress = Array.isArray(to) ? to.join(", ") : to;
  const mailOptions: { to: string; subject: string; html?: string; text?: string } = {
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
function parseEmailMessage(
  parsed: ParsedMail,
  uid: number,
  flags: string[]
): EmailMessage {
  // Gestion du type AddressObject qui peut être un tableau
  let fromAddresses: any[] = [];
  let toAddresses: any[] = [];

  if (parsed.from) {
    const fromValue: any = parsed.from;
    if (fromValue.value) {
      fromAddresses = Array.isArray(fromValue.value) ? fromValue.value : [fromValue.value];
    } else if (Array.isArray(fromValue)) {
      fromAddresses = fromValue;
    } else {
      fromAddresses = [fromValue];
    }
  }

  if (parsed.to) {
    const toValue: any = parsed.to;
    if (toValue.value) {
      toAddresses = Array.isArray(toValue.value) ? toValue.value : [toValue.value];
    } else if (Array.isArray(toValue)) {
      toAddresses = toValue;
    } else {
      toAddresses = [toValue];
    }
  }

  const result: EmailMessage = {
    id: parsed.messageId || `${uid}`,
    uid,
    subject: parsed.subject || "(Aucun sujet)",
    from: fromAddresses.map((addr: any) => ({
      address: addr.address || "",
      name: addr.name || "",
    })),
    to: toAddresses.map((addr: any) => ({
      address: addr.address || "",
      name: addr.name || "",
    })),
    date: parsed.date || new Date(),
    attachments:
      parsed.attachments?.map((att) => ({
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
function findMailbox(
  imap: Imap,
  mailboxType: MailboxType,
  callback: (err: Error | null, mailboxName: string) => void
): void {
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
      const found = boxNames.find(
        (name) => name.toLowerCase() === possibleName.toLowerCase()
      );
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
function getDisplayName(mailboxName: string): string {
  const mapping: Record<string, string> = {
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
  };

  return mapping[mailboxName] || mailboxName;
}
