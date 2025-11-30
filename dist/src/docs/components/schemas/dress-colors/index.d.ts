declare const _default: {
    HardDeleteDressColorResponse: {
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
    ErrorResponse: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            error: {
                type: string;
                example: string;
            };
        };
    };
    SoftDeleteDressColorResponse: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        example: string;
                    };
                    hex_code: {
                        type: string;
                        example: string;
                    };
                    deleted_by: {
                        type: string[];
                        format: string;
                        example: string;
                    };
                    deleted_at: {
                        type: string;
                        format: string;
                        example: string;
                    };
                };
            };
        };
    };
    CreateDressColorRequest: {
        type: string;
        required: string[];
        properties: {
            name: {
                type: string;
                example: string;
                description: string;
            };
            hex_code: {
                type: string;
                example: string;
                pattern: string;
                description: string;
            };
        };
    };
    CreateDressColorResponse: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        example: string;
                    };
                    hex_code: {
                        type: string;
                        example: string;
                    };
                    created_by: {
                        type: string[];
                        format: string;
                        example: string;
                        description: string;
                    };
                    created_at: {
                        type: string;
                        format: string;
                        example: string;
                    };
                };
            };
        };
    };
    UpdateDressColorRequest: {
        type: string;
        required: never[];
        properties: {
            name: {
                type: string;
                example: string;
                description: string;
            };
            hex_code: {
                type: string;
                example: string;
                description: string;
            };
        };
    };
    UpdateDressColorResponse: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        example: string;
                    };
                    hex_code: {
                        type: string;
                        example: string;
                    };
                    updated_by: {
                        type: string[];
                        format: string;
                        example: string;
                    };
                    updated_at: {
                        type: string;
                        format: string;
                        example: string;
                    };
                };
            };
        };
    };
    DressColor: {
        type: string;
        properties: {
            id: {
                type: string;
                format: string;
                example: string;
            };
            name: {
                type: string;
                example: string;
            };
            hex_value: {
                type: string;
                example: string;
                description: string;
            };
            created_at: {
                type: string;
                format: string;
                example: string;
            };
            updated_at: {
                type: string[];
                format: string;
                example: null;
            };
        };
        required: string[];
    };
    DressColorListResponse: {
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
};
export default _default;
//# sourceMappingURL=index.d.ts.map