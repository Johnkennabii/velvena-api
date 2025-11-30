interface NotificationPayload {
    type: string;
    title: string;
    message?: string;
    [key: string]: any;
}
export declare function emitAndStoreNotification(payload: NotificationPayload): Promise<{
    id: string;
    type: string;
    title: string;
    created_at: Date;
    message: string | null;
    meta: import("@prisma/client/runtime/library").JsonValue | null;
} | undefined>;
export {};
//# sourceMappingURL=notifications.d.ts.map