interface MailOptions {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html?: string;
    text?: string;
}
export declare function sendMail({ to, cc, bcc, subject, html, text }: MailOptions): Promise<void>;
export {};
//# sourceMappingURL=mailer.d.ts.map