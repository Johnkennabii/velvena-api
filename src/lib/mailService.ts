import Imap from "imap";
import { simpleParser } from "mailparser";
import type { ParsedMail } from "mailparser";
import pino from "pino";
import { sendMail } from "./mailer.js";
import MailComposer from "nodemailer/lib/mail-composer/index.js";

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

export type MailboxType = "INBOX" | "Sent" | "Trash" | "Spam" | "Drafts";

type MailboxEntry = { name: string; selectable: boolean };
export type MailFolder = MailboxEntry;
export type MailAttachmentInput = {
  filename: string;
  content: string;
  contentType?: string;
  encoding?: BufferEncoding;
};
export type NormalizedAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};
type MailComposerOptions = {
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: NormalizedAttachment[];
  headers?: Record<string, string>;
};

const MAILBOX_MAPPING: Record<MailboxType, string[]> = {
  INBOX: ["INBOX"],
  Sent: ["Sent", "[Gmail]/Sent Mail", "Sent Items"],
  Trash: ["Trash", "[Gmail]/Trash", "Deleted Items", "Corbeille"],
  Spam: ["Junk", "Spam", "[Gmail]/Spam", "Courrier indésirable"],
  Drafts: ["Drafts", "[Gmail]/Drafts", "Brouillons"],
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
    let timeoutId: NodeJS.Timeout;

    // Timeout de 45 secondes
    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
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
          } catch (e) {
            // Ignore
          }
          return reject(err);
        }

        imap.openBox(mailboxName, true, (err, box) => {
          if (err) {
            clearTimeout(timeoutId);
            try {
              imap.end();
            } catch (e) {
              // Ignore
            }
            return reject(err);
          }

          const total = box.messages.total;
          if (total === 0) {
            clearTimeout(timeoutId);
            try {
              imap.end();
            } catch (e) {
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
            } catch (e) {
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
              } catch (e) {
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
                processedMessages++;

                if (!err && parsed) {
                  emails.push(parseEmailMessage(parsed, uid, flags));
                } else {
                  logger.error({ err, seqno }, "Erreur de parsing email");
                }

                checkComplete();
              });
            });
          });

          fetch.once("error", (err: Error) => {
            clearTimeout(timeoutId);
            try {
              imap.end();
            } catch (e) {
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
 * Récupère un email spécifique par son UID avec TOUS les détails (HTML, texte, pièces jointes)
 */
export async function getEmailByUid(
  uid: number,
  mailboxType: MailboxType = "INBOX"
): Promise<EmailMessage | null> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();
    let email: EmailMessage | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let finished = false;

    const clear = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const safeEnd = () => {
      try {
        imap.end();
      } catch (e) {
        // Ignore
      }
    };

    const safeDestroy = () => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
    };

    const finishResolve = (value: EmailMessage | null) => {
      if (finished) return;
      finished = true;
      clear();
      safeEnd();
      resolve(value);
    };

    const finishReject = (err: Error) => {
      if (finished) return;
      finished = true;
      clear();
      safeDestroy();
      reject(err);
    };

    // Timeout de 30 secondes (évite 504 nginx)
    timeoutId = setTimeout(() => {
      finishReject(new Error("Timeout lors de la récupération de l'email"));
    }, 30000);

    imap.once("ready", () => {
      findMailbox(imap, mailboxType, (err, mailboxName) => {
        if (err) {
          return finishReject(err);
        }

        imap.openBox(mailboxName, true, (err) => {
          if (err) {
            return finishReject(err);
          }

          // fetch utilise des UIDs par défaut (pas seq.fetch)
          // Utilise une plage pour être compatible avec tous les serveurs IMAP
          const fetch = imap.fetch(
            `${uid}:${uid}`,
            {
              bodies: "", // Récupère le corps complet
              struct: true,
            }
          );

          let messageReceived = false;

          fetch.on("message", (msg) => {
            messageReceived = true;
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
                  return finishReject(err || new Error("Parsing failed"));
                }

                email = parseEmailMessage(parsed, uid, flags);
                logger.info({ uid, hasHtml: !!email.html, hasText: !!email.text }, "Email complet récupéré");
                finishResolve(email);
              });
            });
          });

          fetch.once("error", (err: Error) => {
            finishReject(err);
          });

          fetch.once("end", () => {
            // Si aucun message n'a été reçu, l'email n'existe pas
            if (!finished && !messageReceived) {
              finishResolve(null);
            }
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
      logger.error({ err }, "Erreur de connexion IMAP");
      finishReject(err);
    });

    try {
      imap.connect();
    } catch (err) {
      finishReject(err as Error);
    }
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
    let timeoutId: NodeJS.Timeout;

    // Timeout de 30 secondes
    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(new Error("Timeout lors de la suppression de l'email"));
    }, 30000);

    imap.once("ready", () => {
      findMailbox(imap, mailboxType, (err, sourceMailbox) => {
        if (err) {
          clearTimeout(timeoutId);
          try { imap.end(); } catch (e) {}
          return reject(err);
        }

        findMailbox(imap, "Trash", (err, trashMailbox) => {
          if (err) {
            clearTimeout(timeoutId);
            try { imap.end(); } catch (e) {}
            return reject(err);
          }

          imap.openBox(sourceMailbox, false, (err) => {
            if (err) {
              clearTimeout(timeoutId);
              try { imap.end(); } catch (e) {}
              return reject(err);
            }

            // Déplace vers la corbeille
            imap.move([uid], trashMailbox, (err) => {
              clearTimeout(timeoutId);
              if (err) {
                try { imap.end(); } catch (e) {}
                return reject(err);
              }

              logger.info({ uid, from: sourceMailbox, to: trashMailbox }, "Email déplacé vers la corbeille");
              try { imap.end(); } catch (e) {}
              // Résoudre immédiatement après le move
              resolve();
            });
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
      clearTimeout(timeoutId);
      logger.error({ err }, "Erreur de connexion IMAP");
      try {
        imap.destroy();
      } catch (e) {}
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
 * Supprime définitivement un email
 */
export async function permanentlyDeleteEmail(
  uid: number,
  mailboxType: MailboxType = "INBOX"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();
    let timeoutId: NodeJS.Timeout | null = null;

    const clear = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const safeEnd = () => {
      try {
        imap.end();
      } catch (e) {
        // Ignore
      }
    };

    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(new Error("Timeout lors de la suppression définitive de l'email"));
    }, 30000);

    imap.once("ready", () => {
      findMailbox(imap, mailboxType, (err, mailboxName) => {
        if (err) {
          clear();
          safeEnd();
          return reject(err);
        }

        imap.openBox(mailboxName, false, (err) => {
          if (err) {
            clear();
            safeEnd();
            return reject(err);
          }

          // Marque comme supprimé
          imap.addFlags([uid], ["\\Deleted"], (err) => {
            if (err) {
              clear();
              safeEnd();
              return reject(err);
            }

            // Expunge pour supprimer définitivement
            imap.expunge((err) => {
              if (err) {
                clear();
                safeEnd();
                return reject(err);
              }

              logger.info({ uid, mailbox: mailboxName }, "Email supprimé définitivement");
              clear();
              safeEnd();
              resolve();
            });
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
      logger.error({ err }, "Erreur de connexion IMAP");
      clear();
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(err);
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
    let timeoutId: NodeJS.Timeout | null = null;

    const clear = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const safeEnd = () => {
      try {
        imap.end();
      } catch (e) {
        // Ignore
      }
    };

    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(new Error("Timeout lors du marquage comme lu"));
    }, 30000);

    imap.once("ready", () => {
      findMailbox(imap, mailboxType, (err, mailboxName) => {
        if (err) {
          clear();
          safeEnd();
          return reject(err);
        }

        imap.openBox(mailboxName, false, (err) => {
          if (err) {
            clear();
            safeEnd();
            return reject(err);
          }

          imap.addFlags([uid], ["\\Seen"], (err) => {
            if (err) {
              clear();
              safeEnd();
              return reject(err);
            }

            logger.info({ uid, mailbox: mailboxName }, "Email marqué comme lu");
            clear();
            safeEnd();
            resolve();
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
      logger.error({ err }, "Erreur de connexion IMAP");
      clear();
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(err);
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
    let timeoutId: NodeJS.Timeout | null = null;

    const clear = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const safeEnd = () => {
      try {
        imap.end();
      } catch (e) {
        // Ignore
      }
    };

    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(new Error("Timeout lors du marquage comme non lu"));
    }, 30000);

    imap.once("ready", () => {
      findMailbox(imap, mailboxType, (err, mailboxName) => {
        if (err) {
          clear();
          safeEnd();
          return reject(err);
        }

        imap.openBox(mailboxName, false, (err) => {
          if (err) {
            clear();
            safeEnd();
            return reject(err);
          }

          imap.delFlags([uid], ["\\Seen"], (err) => {
            if (err) {
              clear();
              safeEnd();
              return reject(err);
            }

            logger.info({ uid, mailbox: mailboxName }, "Email marqué comme non lu");
            clear();
            safeEnd();
            resolve();
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
      logger.error({ err }, "Erreur de connexion IMAP");
      clear();
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(err);
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

    // Timeout de 30 secondes pour l'opération complète (plus long car on ouvre chaque boîte)
    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore les erreurs de destroy
      }
      reject(new Error("Timeout lors de la récupération des boîtes mail"));
    }, 30000);

    imap.once("ready", () => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          clearTimeout(timeoutId);
          logger.error({ err }, "Erreur lors de getBoxes");
          try { imap.end(); } catch (e) {}
          return reject(err);
        }

        const boxNames = Object.keys(boxes);

        // Boîtes principales à chercher (en respectant les noms Gandi)
        const mainBoxNames = ["INBOX", "Sent", "Trash", "Junk", "Drafts"];
        const mainMailboxes: MailboxInfo[] = [];

        // Liste des boîtes existantes à ouvrir
        const boxesToOpen: string[] = [];
        for (const mainName of mainBoxNames) {
          const foundBox = boxNames.find(
            name => name.toLowerCase() === mainName.toLowerCase()
          );
          if (foundBox && boxes[foundBox]) {
            boxesToOpen.push(foundBox);
          }
        }

        // Fonction pour ouvrir chaque boîte et récupérer les comptes
        let processedBoxes = 0;

        const openNextBox = (index: number) => {
          if (index >= boxesToOpen.length) {
            // Toutes les boîtes ont été traitées
            clearTimeout(timeoutId);
            try { imap.end(); } catch (e) {}
            resolve(mainMailboxes);
            return;
          }

          const boxName = boxesToOpen[index]!; // Non-null assertion car on a vérifié index < length

          imap.openBox(boxName, true, (openErr: Error | null, box: any) => {
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
            } else {
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
              } else {
                imap.search(['UNSEEN'], (searchErr: Error | null, unseenUids: number[]) => {
                  if (searchErr) {
                    logger.warn({ boxName, err: searchErr }, "Erreur lors de la recherche UNSEEN");
                    // En cas d'erreur, on met 0 pour les non lus
                    mainMailboxes.push({
                      name: boxName,
                      displayName: getDisplayName(boxName),
                      total,
                      new: 0,
                    });
                  } else {
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
 * Liste tous les dossiers IMAP (plats)
 */
export async function listMailFolders(): Promise<MailFolder[]> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();
    let timeoutId: NodeJS.Timeout | null = null;

    const clear = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const safeEnd = () => {
      try {
        imap.end();
      } catch (e) {
        // Ignore
      }
    };

    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(new Error("Timeout lors de la récupération des dossiers"));
    }, 20000);

    imap.once("ready", () => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          clear();
          safeEnd();
          logger.error({ err }, "Erreur lors de getBoxes pour la liste des dossiers");
          return reject(err);
        }

        const folders = flattenMailboxEntries(boxes);
        clear();
        safeEnd();
        resolve(folders);
      });
    });

    imap.once("error", (err: Error) => {
      clear();
      logger.error({ err }, "Erreur de connexion IMAP lors de listMailFolders");
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
      clear();
      reject(err);
    }
  });
}

/**
 * Crée un nouveau dossier IMAP
 */
export async function createMailFolder(folderName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();
    let timeoutId: NodeJS.Timeout | null = null;

    const clear = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const safeEnd = () => {
      try {
        imap.end();
      } catch (e) {
        // Ignore
      }
    };

    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(new Error("Timeout lors de la création du dossier"));
    }, 20000);

    imap.once("ready", () => {
      imap.addBox(folderName, (err) => {
        if (err) {
          clear();
          safeEnd();
          return reject(err);
        }
        clear();
        safeEnd();
        resolve();
      });
    });

    imap.once("error", (err: Error) => {
      clear();
      logger.error({ err }, "Erreur de connexion IMAP lors de createMailFolder");
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
      clear();
      reject(err);
    }
  });
}

/**
 * Renomme ou déplace un dossier IMAP (ancien chemin -> nouveau chemin)
 */
export async function moveMailFolder(fromName: string, toName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();
    let timeoutId: NodeJS.Timeout | null = null;

    const clear = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const safeEnd = () => {
      try {
        imap.end();
      } catch (e) {
        // Ignore
      }
    };

    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(new Error("Timeout lors du déplacement du dossier"));
    }, 20000);

    imap.once("ready", () => {
      imap.renameBox(fromName, toName, (err) => {
        if (err) {
          clear();
          safeEnd();
          return reject(err);
        }
        clear();
        safeEnd();
        resolve();
      });
    });

    imap.once("error", (err: Error) => {
      clear();
      logger.error({ err }, "Erreur de connexion IMAP lors de moveMailFolder");
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
      clear();
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
  text?: string,
  cc?: string | string[],
  bcc?: string | string[],
  attachments?: MailAttachmentInput[],
): Promise<void> {
  const toAddress = Array.isArray(to) ? to.join(", ") : to;
  const ccAddress = cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : undefined;
  const bccAddress = bcc ? (Array.isArray(bcc) ? bcc.join(", ") : bcc) : undefined;
  const normalizedAttachments: NormalizedAttachment[] | undefined = attachments
    ? attachments.map((att) => ({
        filename: att.filename,
        content: Buffer.from(att.content, att.encoding || "base64"),
        ...(att.contentType ? { contentType: att.contentType } : {}),
      }))
    : undefined;
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "";
  const mailOptions: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    html?: string;
    text?: string;
    attachments?: NormalizedAttachment[];
  } = {
    to: toAddress,
    ...(ccAddress ? { cc: ccAddress } : {}),
    ...(bccAddress ? { bcc: bccAddress } : {}),
    subject,
  };

  if (html) {
    mailOptions.html = html;
  }

  if (text) {
    mailOptions.text = text;
  }

  if (normalizedAttachments?.length) {
    mailOptions.attachments = normalizedAttachments;
  }

  const composerPayload: MailComposerOptions = {
    from: fromAddress,
    to: toAddress,
    ...(ccAddress ? { cc: ccAddress } : {}),
    ...(bccAddress ? { bcc: bccAddress } : {}),
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
    ...(normalizedAttachments?.length ? { attachments: normalizedAttachments } : {}),
    ...(process.env.SMTP_FROM ? { replyTo: process.env.SMTP_FROM } : {}),
  };

  const rawMessage = await buildRawMime(composerPayload).catch((err) => {
    logger.warn({ err }, "⚠️ Impossible de générer le MIME pour la copie Sent; envoi SMTP seul");
    return null;
  });

  await sendMail(mailOptions);

  if (rawMessage) {
    await appendToMailbox(rawMessage, "Sent").catch((err) => {
      logger.warn({ err }, "⚠️ Email envoyé mais copie Sent non ajoutée");
    });
  }
}

/**
 * Ajoute un flag à un email
 * Flags IMAP standards: \Seen, \Answered, \Flagged, \Deleted, \Draft
 */
export async function addFlag(
  uid: number,
  flag: string,
  mailboxType: MailboxType = "INBOX"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();
    let timeoutId: NodeJS.Timeout | null = null;

    const clear = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const safeEnd = () => {
      try {
        imap.end();
      } catch (e) {
        // Ignore
      }
    };

    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(new Error("Timeout lors de l'ajout du flag"));
    }, 30000);

    imap.once("ready", () => {
      findMailbox(imap, mailboxType, (err, mailboxName) => {
        if (err) {
          clear();
          safeEnd();
          return reject(err);
        }

        imap.openBox(mailboxName, false, (err) => {
          if (err) {
            clear();
            safeEnd();
            return reject(err);
          }

          imap.addFlags([uid], [flag], (err) => {
            clear();
            if (err) {
              safeEnd();
              return reject(err);
            }

            logger.info({ uid, flag, mailbox: mailboxName }, "Flag ajouté à l'email");
            safeEnd();
            resolve();
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
      clear();
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
      clear();
      reject(err);
    }
  });
}

/**
 * Retire un flag d'un email
 */
export async function removeFlag(
  uid: number,
  flag: string,
  mailboxType: MailboxType = "INBOX"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();
    let timeoutId: NodeJS.Timeout | null = null;

    const clear = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const safeEnd = () => {
      try {
        imap.end();
      } catch (e) {
        // Ignore
      }
    };

    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(new Error("Timeout lors du retrait du flag"));
    }, 30000);

    imap.once("ready", () => {
      findMailbox(imap, mailboxType, (err, mailboxName) => {
        if (err) {
          clear();
          safeEnd();
          return reject(err);
        }

        imap.openBox(mailboxName, false, (err) => {
          if (err) {
            clear();
            safeEnd();
            return reject(err);
          }

          imap.delFlags([uid], [flag], (err) => {
            clear();
            if (err) {
              safeEnd();
              return reject(err);
            }

            logger.info({ uid, flag, mailbox: mailboxName }, "Flag retiré de l'email");
            safeEnd();
            resolve();
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
      clear();
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
      clear();
      reject(err);
    }
  });
}

/**
 * Récupère une pièce jointe spécifique d'un email par son index
 */
export async function getEmailAttachment(
  uid: number,
  attachmentIndex: number,
  mailboxType: MailboxType = "INBOX"
): Promise<{ filename: string; contentType: string; content: Buffer } | null> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();
    let timeoutId: NodeJS.Timeout;

    timeoutId = setTimeout(() => {
      try { imap.destroy(); } catch (e) {}
      reject(new Error("Timeout lors de la récupération de la pièce jointe"));
    }, 30000);

    imap.once("ready", () => {
      findMailbox(imap, mailboxType, (err, mailboxName) => {
        if (err) {
          clearTimeout(timeoutId);
          try { imap.end(); } catch (e) {}
          return reject(err);
        }

        imap.openBox(mailboxName, true, (err) => {
          if (err) {
            clearTimeout(timeoutId);
            try { imap.end(); } catch (e) {}
            return reject(err);
          }

          const fetch = imap.fetch(`${uid}:${uid}`, {
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
              simpleParser(buffer, (err: Error | undefined, parsed: ParsedMail | undefined) => {
                clearTimeout(timeoutId);

                if (err || !parsed) {
                  logger.error({ err, uid }, "Erreur de parsing email pour PJ");
                  try { imap.end(); } catch (e) {}
                  return reject(err || new Error("Parsing failed"));
                }

                const attachments = parsed.attachments || [];

                if (attachmentIndex < 0 || attachmentIndex >= attachments.length) {
                  logger.warn({ uid, attachmentIndex, total: attachments.length }, "Index de PJ invalide");
                  try { imap.end(); } catch (e) {}
                  return resolve(null);
                }

                const attachment = attachments[attachmentIndex];
                if (!attachment) {
                  logger.warn({ uid, attachmentIndex }, "Pièce jointe non trouvée");
                  try { imap.end(); } catch (e) {}
                  return resolve(null);
                }

                logger.info({ uid, filename: attachment.filename, size: attachment.size }, "Pièce jointe récupérée");

                try { imap.end(); } catch (e) {}
                resolve({
                  filename: attachment.filename || "attachment",
                  contentType: attachment.contentType,
                  content: attachment.content,
                });
              });
            });
          });

          fetch.once("error", (err: Error) => {
            clearTimeout(timeoutId);
            try { imap.end(); } catch (e) {}
            reject(err);
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
      clearTimeout(timeoutId);
      logger.error({ err }, "Erreur de connexion IMAP");
      try { imap.destroy(); } catch (e) {}
      reject(err);
    });

    imap.once("end", () => {
      // Résolution déjà gérée dans le fetch
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
 * Déplace un email d'une boîte mail vers une autre
 */
export async function moveEmail(
  uid: number,
  fromMailboxType: MailboxType,
  toMailboxType: MailboxType
): Promise<void> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();
    let timeoutId: NodeJS.Timeout | null = null;

    const clear = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const safeEnd = () => {
      try {
        imap.end();
      } catch (e) {
        // Ignore
      }
    };

    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(new Error("Timeout lors du déplacement de l'email"));
    }, 30000);

    imap.once("ready", () => {
      findMailbox(imap, fromMailboxType, (err, sourceMailbox) => {
        if (err) {
          clear();
          safeEnd();
          return reject(err);
        }

        findMailbox(imap, toMailboxType, (err, targetMailbox) => {
          if (err) {
            clear();
            safeEnd();
            return reject(err);
          }

          imap.openBox(sourceMailbox, false, (err) => {
            if (err) {
              clear();
              safeEnd();
              return reject(err);
            }

            imap.move([uid], targetMailbox, (err) => {
              clear();
              if (err) {
                safeEnd();
                return reject(err);
              }

              logger.info({ uid, from: sourceMailbox, to: targetMailbox }, "Email déplacé");
              safeEnd();
              resolve();
            });
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
      clear();
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
      clear();
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
      const found = boxNames.find(
        (name) => name.toLowerCase() === possibleName.toLowerCase()
      );
      if (found) {
        return callback(null, found);
      }
    }

    // Par défaut, utilise INBOX ou la première boîte disponible
    const defaultBox =
      entries.find((entry) => entry.name === "INBOX" && entry.selectable)?.name ??
      entries.find((entry) => entry.selectable)?.name ??
      "INBOX";
    callback(null, defaultBox);
  });
}

function flattenMailboxEntries(
  boxes: Imap.MailBoxes,
  parent = "",
  parentDelimiter = "/"
): MailboxEntry[] {
  const entries: MailboxEntry[] = [];

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

async function buildRawMime(options: MailComposerOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const composer = new MailComposer({
      ...options,
      date: new Date(),
      headers: {
        "X-Mailer": "Velvena Mailer",
        "X-Priority": "3",
        Importance: "Normal",
        "X-MSMail-Priority": "Normal",
        ...(options.headers || {}),
      },
    });

    composer.compile().build((err: Error | null, message: Buffer) => {
      if (err) return reject(err);
      resolve(message);
    });
  });
}

async function appendToMailbox(rawMessage: Buffer, mailboxType: MailboxType = "Sent"): Promise<void> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();
    let timeoutId: NodeJS.Timeout | null = null;

    const clear = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const safeEnd = () => {
      try {
        imap.end();
      } catch (e) {
        // Ignore
      }
    };

    timeoutId = setTimeout(() => {
      try {
        imap.destroy();
      } catch (e) {
        // Ignore
      }
      reject(new Error("Timeout lors de la copie dans la boîte mail"));
    }, 30000);

    imap.once("ready", () => {
      findMailbox(imap, mailboxType, (err, mailboxName) => {
        if (err) {
          clear();
          safeEnd();
          return reject(err);
        }

        imap.append(rawMessage, { mailbox: mailboxName, flags: ["\\Seen"] }, (appendErr) => {
          clear();
          if (appendErr) {
            safeEnd();
            return reject(appendErr);
          }
          logger.info({ mailbox: mailboxName }, "Email copié dans la boîte envoyés");
          safeEnd();
          resolve();
        });
      });
    });

    imap.once("error", (err: Error) => {
      clear();
      logger.error({ err }, "Erreur IMAP lors de la copie Sent");
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
      clear();
      reject(err);
    }
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
    Brouillons: "Brouillons",
  };

  return mapping[mailboxName] || mailboxName;
}

/**
 * Répondre à un email
 * @param uid - UID de l'email original
 * @param mailboxType - Type de boîte mail (par défaut INBOX)
 * @param replyBody - Corps de la réponse (HTML ou texte)
 * @param replyBodyText - Corps de la réponse en texte brut (optionnel)
 * @param attachments - Pièces jointes optionnelles
 */
export async function replyToEmail(
  uid: number,
  mailboxType: MailboxType,
  replyBody: string,
  replyBodyText?: string,
  attachments?: MailAttachmentInput[]
): Promise<void> {
  const originalEmail = await getEmailByUid(uid, mailboxType);

  if (!originalEmail) {
    throw new Error("Email original introuvable");
  }

  const replyTo = originalEmail.from[0]?.address;

  if (!replyTo) {
    throw new Error("Impossible de déterminer l'expéditeur de l'email original");
  }

  const originalSubject = originalEmail.subject || "(sans objet)";
  const replySubject = originalSubject.toLowerCase().startsWith("re:")
    ? originalSubject
    : `Re: ${originalSubject}`;

  const originalDate = new Date(originalEmail.date || Date.now()).toLocaleString("fr-FR");
  const originalFrom = originalEmail.from[0]?.name
    ? `${originalEmail.from[0].name} <${originalEmail.from[0].address}>`
    : originalEmail.from[0]?.address || "Expéditeur inconnu";

  const quotedHtml = `
<div>
  ${replyBody}
</div>
<br/>
<div style="border-left: 2px solid #ccc; padding-left: 10px; margin-top: 20px; color: #666;">
  <p><strong>Le ${originalDate}, ${originalFrom} a écrit :</strong></p>
  ${originalEmail.html || (originalEmail.text ? `<p>${originalEmail.text.replace(/\n/g, '<br/>')}</p>` : "")}
</div>`;

  const originalTextContent = originalEmail.text || "";
  const quotedText = replyBodyText
    ? `${replyBodyText}\n\n--- Le ${originalDate}, ${originalFrom} a écrit ---\n${originalTextContent}`
    : undefined;

  await sendEmail(
    replyTo,
    replySubject,
    quotedHtml,
    quotedText,
    undefined,
    undefined,
    attachments
  );

  await addFlag(uid, "\\Answered", mailboxType);
}

/**
 * Répondre à tous (expéditeur + tous les destinataires originaux)
 */
export async function replyAllToEmail(
  uid: number,
  mailboxType: MailboxType,
  replyBody: string,
  replyBodyText?: string,
  attachments?: MailAttachmentInput[]
): Promise<void> {
  const originalEmail = await getEmailByUid(uid, mailboxType);

  if (!originalEmail) {
    throw new Error("Email original introuvable");
  }

  const replyTo = originalEmail.from[0]?.address;

  if (!replyTo) {
    throw new Error("Impossible de déterminer l'expéditeur de l'email original");
  }

  const ccAddresses: string[] = [];

  // Ajouter tous les destinataires originaux sauf l'utilisateur actuel
  if (originalEmail.to) {
    originalEmail.to.forEach((addr) => {
      if (addr.address && addr.address !== process.env.SMTP_USER) {
        ccAddresses.push(addr.address);
      }
    });
  }

  // Filtrer le destinataire principal pour éviter les doublons
  const filteredCc = ccAddresses.filter((addr) => addr !== replyTo);

  const originalSubject = originalEmail.subject || "(sans objet)";
  const replySubject = originalSubject.toLowerCase().startsWith("re:")
    ? originalSubject
    : `Re: ${originalSubject}`;

  const originalDate = new Date(originalEmail.date || Date.now()).toLocaleString("fr-FR");
  const originalFrom = originalEmail.from[0]?.name
    ? `${originalEmail.from[0].name} <${originalEmail.from[0].address}>`
    : originalEmail.from[0]?.address || "Expéditeur inconnu";

  const quotedHtml = `
<div>
  ${replyBody}
</div>
<br/>
<div style="border-left: 2px solid #ccc; padding-left: 10px; margin-top: 20px; color: #666;">
  <p><strong>Le ${originalDate}, ${originalFrom} a écrit :</strong></p>
  ${originalEmail.html || (originalEmail.text ? `<p>${originalEmail.text.replace(/\n/g, '<br/>')}</p>` : "")}
</div>`;

  const originalTextContent = originalEmail.text || "";
  const quotedText = replyBodyText
    ? `${replyBodyText}\n\n--- Le ${originalDate}, ${originalFrom} a écrit ---\n${originalTextContent}`
    : undefined;

  await sendEmail(
    replyTo,
    replySubject,
    quotedHtml,
    quotedText,
    filteredCc.length > 0 ? filteredCc : undefined,
    undefined,
    attachments
  );

  await addFlag(uid, "\\Answered", mailboxType);
}

/**
 * Transférer un email
 */
export async function forwardEmail(
  uid: number,
  mailboxType: MailboxType,
  to: string | string[],
  forwardMessage?: string,
  forwardMessageText?: string,
  includeAttachments: boolean = true
): Promise<void> {
  const originalEmail = await getEmailByUid(uid, mailboxType);

  if (!originalEmail) {
    throw new Error("Email original introuvable");
  }

  const originalSubject = originalEmail.subject || "(sans objet)";
  const forwardSubject = originalSubject.toLowerCase().startsWith("fwd:") || originalSubject.toLowerCase().startsWith("tr:")
    ? originalSubject
    : `Fwd: ${originalSubject}`;

  const originalDate = new Date(originalEmail.date || Date.now()).toLocaleString("fr-FR");
  const originalFrom = originalEmail.from[0]?.name
    ? `${originalEmail.from[0].name} <${originalEmail.from[0].address}>`
    : originalEmail.from[0]?.address || "Expéditeur inconnu";
  const originalTo = originalEmail.to
    .map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address)
    .join(", ") || "Destinataire inconnu";

  const forwardHeader = `
<div style="margin-bottom: 20px;">
  ${forwardMessage || ""}
</div>
<br/>
<div style="border-top: 1px solid #ccc; padding-top: 10px; color: #666;">
  <p><strong>---------- Message transféré ----------</strong></p>
  <p><strong>De :</strong> ${originalFrom}</p>
  <p><strong>Date :</strong> ${originalDate}</p>
  <p><strong>Objet :</strong> ${originalSubject}</p>
  <p><strong>À :</strong> ${originalTo}</p>
</div>
<br/>
<div>
  ${originalEmail.html || (originalEmail.text ? `<p>${originalEmail.text.replace(/\n/g, '<br/>')}</p>` : "")}
</div>`;

  const forwardTextHeader = forwardMessageText
    ? `${forwardMessageText}\n\n---------- Message transféré ----------\nDe : ${originalFrom}\nDate : ${originalDate}\nObjet : ${originalSubject}\nÀ : ${originalTo}\n\n${originalEmail.text || ""}`
    : undefined;

  let attachments: MailAttachmentInput[] | undefined;

  if (includeAttachments && originalEmail.attachments && originalEmail.attachments.length > 0) {
    attachments = originalEmail.attachments.map((att) => ({
      filename: att.filename || "attachment",
      content: att.content?.toString("base64") || "",
      encoding: "base64" as const,
      contentType: att.contentType,
    }));
  }

  await sendEmail(
    to,
    forwardSubject,
    forwardHeader,
    forwardTextHeader,
    undefined,
    undefined,
    attachments
  );
}
