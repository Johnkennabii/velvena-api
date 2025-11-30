declare const _default: {
    HardDeleteDressTypeResponse: {
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
            data: {
                type: string[];
                example: null;
            };
        };
    };
    SoftDeleteDressTypeResponse: {
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
                    };
                    name: {
                        type: string;
                    };
                    deleted_at: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
    };
    UpdateDressTypeRequest: {
        type: string;
        properties: {
            name: {
                type: string;
                example: string;
            };
            description: {
                type: string[];
                example: string;
            };
        };
    };
    UpdateDressTypeResponse: {
        type: string;
        properties: {
            success: {
                type: string;
            };
            data: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                    };
                    name: {
                        type: string;
                    };
                    description: {
                        type: string[];
                    };
                    updated_by: {
                        type: string[];
                        format: string;
                    };
                    updated_at: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
    };
    CreateDressTypeRequest: {
        type: string;
        required: string[];
        properties: {
            name: {
                type: string;
                example: string;
            };
            description: {
                type: string[];
                example: string;
            };
        };
    };
    CreateDressTypeResponse: {
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
                    };
                    name: {
                        type: string;
                    };
                    description: {
                        type: string[];
                    };
                };
            };
        };
    };
    GetDressTypesResponse: {
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
                        };
                        name: {
                            type: string;
                            example: string;
                        };
                        description: {
                            type: string[];
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