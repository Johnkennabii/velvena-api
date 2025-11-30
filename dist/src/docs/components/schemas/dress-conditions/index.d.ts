declare const _default: {
    HardDeleteDressConditionResponse: {
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
    SoftDeleteDressConditionResponse: {
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
    UpdateDressConditionRequest: {
        type: string;
        required: string[];
        properties: {
            name: {
                type: string;
                example: string;
            };
        };
    };
    UpdateDressConditionResponse: {
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
    CreateDressConditionRequest: {
        type: string;
        required: string[];
        properties: {
            name: {
                type: string;
                example: string;
            };
        };
    };
    CreateDressConditionResponse: {
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
                    created_by: {
                        type: string[];
                        format: string;
                        example: string;
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
    GetDressConditionsResponse: {
        type: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                type: string;
                items: {
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
                        created_at: {
                            type: string;
                            format: string;
                            example: string;
                        };
                    };
                };
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map