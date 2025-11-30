declare const _default: {
    EmailMessage: {
        type: string;
        properties: {
            id: {
                type: string;
                description: string;
                example: string;
            };
            uid: {
                type: string;
                description: string;
                example: number;
            };
            subject: {
                type: string;
                description: string;
                example: string;
            };
            from: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        address: {
                            type: string;
                            format: string;
                            example: string;
                        };
                        name: {
                            type: string;
                            example: string;
                        };
                    };
                };
            };
            to: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        address: {
                            type: string;
                            format: string;
                            example: string;
                        };
                        name: {
                            type: string;
                            example: string;
                        };
                    };
                };
            };
            date: {
                type: string;
                format: string;
                description: string;
                example: string;
            };
            html: {
                type: string;
                description: string;
                example: string;
            };
            text: {
                type: string;
                description: string;
                example: string;
            };
            attachments: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        filename: {
                            type: string;
                            example: string;
                        };
                        contentType: {
                            type: string;
                            example: string;
                        };
                        size: {
                            type: string;
                            description: string;
                            example: number;
                        };
                    };
                };
            };
            flags: {
                type: string;
                description: string;
                items: {
                    type: string;
                };
                example: string[];
            };
            hasAttachments: {
                type: string;
                description: string;
                example: boolean;
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map