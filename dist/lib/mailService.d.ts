export interface EmailMessage {
    id: string;
    uid: number;
    subject: string;
    from: {
        address: string;
        name: string;
    }[];
    to: {
        address: string;
        name: string;
    }[];
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
/**
 * Récupère les emails d'une boîte mail
 */
export declare function getEmails(mailboxType?: MailboxType, limit?: number, offset?: number): Promise<EmailMessage[]>;
/**
 * Récupère un email spécifique par son UID avec TOUS les détails (HTML, texte, pièces jointes)
 */
export declare function getEmailByUid(uid: number, mailboxType?: MailboxType): Promise<EmailMessage | null>;
/**
 * Supprime un email (le déplace vers la corbeille)
 */
export declare function deleteEmail(uid: number, mailboxType?: MailboxType): Promise<void>;
/**
 * Supprime définitivement un email
 */
export declare function permanentlyDeleteEmail(uid: number, mailboxType?: MailboxType): Promise<void>;
/**
 * Marque un email comme lu
 */
export declare function markAsRead(uid: number, mailboxType?: MailboxType): Promise<void>;
/**
 * Marque un email comme non lu
 */
export declare function markAsUnread(uid: number, mailboxType?: MailboxType): Promise<void>;
/**
 * Récupère les informations sur les boîtes mail
 */
export declare function getMailboxes(): Promise<MailboxInfo[]>;
/**
 * Envoie un email
 */
export declare function sendEmail(to: string | string[], subject: string, html?: string, text?: string, cc?: string | string[], bcc?: string | string[]): Promise<void>;
/**
 * Ajoute un flag à un email
 * Flags IMAP standards: \Seen, \Answered, \Flagged, \Deleted, \Draft
 */
export declare function addFlag(uid: number, flag: string, mailboxType?: MailboxType): Promise<void>;
/**
 * Retire un flag d'un email
 */
export declare function removeFlag(uid: number, flag: string, mailboxType?: MailboxType): Promise<void>;
/**
 * Récupère une pièce jointe spécifique d'un email par son index
 */
export declare function getEmailAttachment(uid: number, attachmentIndex: number, mailboxType?: MailboxType): Promise<{
    filename: string;
    contentType: string;
    content: Buffer;
} | null>;
/**
 * Déplace un email d'une boîte mail vers une autre
 */
export declare function moveEmail(uid: number, fromMailboxType: MailboxType, toMailboxType: MailboxType): Promise<void>;
//# sourceMappingURL=mailService.d.ts.map