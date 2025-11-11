interface NotificationPayload {
    type: string;
    title: string;
    message?: string;
    [key: string]: any;
}
export declare function emitAndStoreNotification(payload: NotificationPayload): Promise<{
    id: string;
    created_at: Date;
    type: string;
    title: string;
    message: string | null;
    meta: import("@prisma/client/runtime/library").JsonValue | null;
    seen: boolean;
} | undefined>;
export {};
//# sourceMappingURL=notifications.d.ts.map