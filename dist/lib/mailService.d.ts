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
export type MailboxType = "INBOX" | "Sent" | "Trash" | "Spam";
/**
 * Récupère les emails d'une boîte mail
 */
export declare function getEmails(mailboxType?: MailboxType, limit?: number, offset?: number): Promise<EmailMessage[]>;
/**
 * Récupère un email spécifique par son UID
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
export declare function sendEmail(to: string | string[], subject: string, html?: string, text?: string): Promise<void>;
//# sourceMappingURL=mailService.d.ts.map