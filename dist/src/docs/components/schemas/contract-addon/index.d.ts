declare const _default: {
    HardDeleteContractAddonResponse: {
        type: string;
        description: string;
        properties: {
            success: {
                type: string;
                description: string;
                example: boolean;
            };
            message: {
                type: string;
                description: string;
                example: string;
            };
        };
        required: string[];
    };
    SoftDeleteContractAddonResponse: {
        type: string;
        description: string;
        properties: {
            success: {
                type: string;
                example: boolean;
            };
            data: {
                type: string;
                description: string;
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
                    price_ht: {
                        type: string;
                        example: number;
                    };
                    price_ttc: {
                        type: string;
                        example: number;
                    };
                    included: {
                        type: string;
                        example: boolean;
                    };
                    deleted_by: {
                        type: string[];
                        description: string;
                        example: string;
                    };
                    deleted_at: {
                        type: string;
                        format: string;
                        description: string;
                        example: string;
                    };
                };
                required: string[];
            };
        };
        required: string[];
    };
    UpdateContractAddonRequest: {
        type: string;
        description: string;
        properties: {
            name: {
                type: string;
                description: string;
                example: string;
            };
            description: {
                type: string[];
                description: string;
                example: string;
            };
            price_ht: {
                type: string;
                format: string;
                description: string;
                example: number;
            };
            price_ttc: {
                type: string;
                format: string;
                description: string;
                example: number;
            };
            included: {
                type: string;
                description: string;
                example: boolean;
            };
        };
        required: string[];
    };
    UpdateContractAddonResponse: {
        type: string;
        description: string;
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
                    description: {
                        type: string[];
                        example: string;
                    };
                    price_ht: {
                        type: string;
                        example: number;
                    };
                    price_ttc: {
                        type: string;
                        example: number;
                    };
                    included: {
                        type: string;
                        example: boolean;
                    };
                    updated_by: {
                        type: string[];
                        description: string;
                        example: string;
                    };
                    updated_at: {
                        type: string;
                        format: string;
                        example: string;
                    };
                };
                required: string[];
            };
        };
        required: string[];
    };
    CreateContractAddonRequest: {
        type: string;
        description: string;
        properties: {
            name: {
                type: string;
                description: string;
                example: string;
            };
            description: {
                type: string[];
                description: string;
                example: string;
            };
            price_ht: {
                type: string;
                format: string;
                description: string;
                example: number;
            };
            price_ttc: {
                type: string;
                format: string;
                description: string;
                example: number;
            };
            included: {
                type: string;
                description: string;
                example: boolean;
            };
        };
        required: string[];
    };
    CreateContractAddonResponse: {
        type: string;
        description: string;
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
                    description: {
                        type: string[];
                        example: string;
                    };
                    price_ht: {
                        type: string;
                        format: string;
                        example: number;
                    };
                    price_ttc: {
                        type: string;
                        format: string;
                        example: number;
                    };
                    included: {
                        type: string;
                        example: boolean;
                    };
                    created_by: {
                        type: string[];
                        description: string;
                        example: string;
                    };
                    created_at: {
                        type: string;
                        format: string;
                        example: string;
                    };
                };
                required: string[];
            };
        };
        required: string[];
    };
    GetContractAddonByIdResponse: {
        type: string;
        description: string;
        properties: {
            success: {
                type: string;
                description: string;
                example: boolean;
            };
            data: {
                type: string;
                description: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                        description: string;
                        example: string;
                    };
                    name: {
                        type: string;
                        description: string;
                        example: string;
                    };
                    description: {
                        type: string[];
                        description: string;
                        example: string;
                    };
                    price_ht: {
                        type: string;
                        format: string;
                        description: string;
                        example: number;
                    };
                    price_ttc: {
                        type: string;
                        format: string;
                        description: string;
                        example: number;
                    };
                    created_at: {
                        type: string;
                        format: string;
                        description: string;
                        example: string;
                    };
                    updated_at: {
                        type: string[];
                        format: string;
                        description: string;
                        example: string;
                    };
                };
                required: string[];
            };
        };
        required: string[];
    };
    GetContractAddonsResponse: {
        type: string;
        description: string;
        properties: {
            success: {
                type: string;
                description: string;
                example: boolean;
            };
            data: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                        };
                        name: {
                            type: string;
                            description: string;
                            example: string;
                        };
                        description: {
                            type: string[];
                            description: string;
                            example: string;
                        };
                        price_ht: {
                            type: string;
                            format: string;
                            description: string;
                            example: number;
                        };
                        price_ttc: {
                            type: string;
                            format: string;
                            description: string;
                            example: number;
                        };
                        created_at: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                        };
                        updated_at: {
                            type: string[];
                            format: string;
                            description: string;
                            example: string;
                        };
                    };
                    required: string[];
                };
            };
        };
        required: string[];
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map