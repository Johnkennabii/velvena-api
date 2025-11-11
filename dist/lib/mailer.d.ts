interface MailOptions {
    to: string;
    subject: string;
    html?: string;
    text?: string;
}
export declare function sendMail({ to, subject, html, text }: MailOptions): Promise<void>;
export {};
//# sourceMappingURL=mailer.d.ts.map