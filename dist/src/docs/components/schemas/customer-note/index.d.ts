export declare const customerNoteSchemas: {
    HardDeleteCustomerNoteResponse: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            message: {
                type: string;
                example: string;
            };
        };
    };
    SoftDeleteCustomerNoteResponse: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                $ref: string;
            };
        };
    };
    UpdateCustomerNoteRequest: {
        type: string;
        required: string[];
        properties: {
            content: {
                type: string;
                description: string;
                example: string;
            };
        };
    };
    UpdateCustomerNoteResponse: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                $ref: string;
            };
        };
    };
    CreateCustomerNoteRequest: {
        type: string;
        required: string[];
        properties: {
            content: {
                type: string;
                description: string;
                example: string;
            };
        };
    };
    CreateCustomerNoteResponse: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                $ref: string;
            };
        };
    };
    GetCustomerNoteResponse: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                $ref: string;
            };
        };
    };
    GetCustomerNotesResponse: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                type: string;
                items: {
                    $ref: string;
                };
            };
        };
    };
    CustomerNote: {
        type: string;
        properties: {
            id: {
                type: string;
                format: string;
                example: string;
            };
            customer_id: {
                type: string;
                format: string;
                example: string;
            };
            content: {
                type: string;
                example: string;
            };
            created_at: {
                type: string;
                format: string;
                example: string;
            };
            created_by: {
                type: string;
                format: string;
                nullable: boolean;
                example: string;
            };
            updated_at: {
                type: string;
                format: string;
                nullable: boolean;
                example: string;
            };
            updated_by: {
                type: string;
                format: string;
                nullable: boolean;
                example: string;
            };
            deleted_at: {
                type: string;
                format: string;
                nullable: boolean;
                example: null;
            };
            deleted_by: {
                type: string;
                format: string;
                nullable: boolean;
                example: null;
            };
        };
    };
};
//# sourceMappingURL=index.d.ts.map