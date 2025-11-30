interface NotificationPayload {
    type: string;
    title: string;
    message?: string;
    [key: string]: any;
}
export declare function emitAndStoreNotification(payload: NotificationPayload): Promise<{
    type: string;
    id: string;
    created_at: Date;
    title: string;
    message: string | null;
    meta: import("@prisma/client/runtime/library").JsonValue | null;
} | undefined>;
export {};
//# sourceMappingURL=notifications.d.ts.map