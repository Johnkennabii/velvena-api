import type { Request, Response } from "express";
/**
 * Récupère les emails d'une boîte mail
 * GET /mails/:mailbox?limit=50&offset=0
 */
export declare function getMailsFromMailbox(req: Request, res: Response): Promise<void>;
/**
 * Récupère un email spécifique par son UID
 * GET /mails/:mailbox/:uid
 */
export declare function getMailById(req: Request, res: Response): Promise<void>;
/**
 * Supprime un email (le déplace vers la corbeille)
 * DELETE /mails/:mailbox/:uid
 */
export declare function deleteMail(req: Request, res: Response): Promise<void>;
/**
 * Supprime définitivement un email
 * DELETE /mails/:mailbox/:uid/permanent
 */
export declare function permanentlyDeleteMail(req: Request, res: Response): Promise<void>;
/**
 * Marque un email comme lu
 * PATCH /mails/:mailbox/:uid/read
 */
export declare function markMailAsRead(req: Request, res: Response): Promise<void>;
/**
 * Marque un email comme non lu
 * PATCH /mails/:mailbox/:uid/unread
 */
export declare function markMailAsUnread(req: Request, res: Response): Promise<void>;
/**
 * Liste tous les dossiers de la boîte mail
 * GET /mails/folders
 */
export declare function listMailFoldersController(req: Request, res: Response): Promise<void>;
/**
 * Crée un dossier IMAP
 * POST /mails/folders
 */
export declare function createMailFolderController(req: Request, res: Response): Promise<void>;
/**
 * Déplace / renomme un dossier IMAP
 * POST /mails/folders/move
 */
export declare function moveMailFolderController(req: Request, res: Response): Promise<void>;
/**
 * Récupère la liste des boîtes mail
 * GET /mails/mailboxes
 */
export declare function listMailboxes(req: Request, res: Response): Promise<void>;
/**
 * Envoie un email
 * POST /mails/send
 */
export declare function sendMail(req: Request, res: Response): Promise<void>;
/**
 * Ajoute un flag à un email
 * PATCH /mails/:mailbox/:uid/flag/add
 */
export declare function addMailFlag(req: Request, res: Response): Promise<void>;
/**
 * Retire un flag d'un email
 * PATCH /mails/:mailbox/:uid/flag/remove
 */
export declare function removeMailFlag(req: Request, res: Response): Promise<void>;
/**
 * Déplace un email d'un dossier à un autre
 * PATCH /mails/:mailbox/:uid/move
 */
export declare function moveMailToFolder(req: Request, res: Response): Promise<void>;
/**
 * Télécharge une pièce jointe d'un email
 * GET /mails/:mailbox/:uid/attachments/:index
 */
export declare function downloadAttachment(req: Request, res: Response): Promise<void>;
/**
 * Télécharge une pièce jointe via UID + boîte mail fournie en query string.
 * GET /emails/:emailId/attachments/:index?mailbox=inbox
 */
export declare function downloadAttachmentByEmailId(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=mailController.d.ts.map