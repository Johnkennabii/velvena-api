interface MailOptions {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: {
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }[];
}
export declare function sendMail({ to, cc, bcc, subject, html, text, attachments }: MailOptions): Promise<void>;
export {};
//# sourceMappingURL=mailer.d.ts.map