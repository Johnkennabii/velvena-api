declare const _default: {
    HardDeleteDressSizeResponse: {
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
    SoftDeleteDressSizeResponse: {
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
                        example: string;
                    };
                    deleted_by: {
                        type: string[];
                        format: string;
                    };
                    deleted_at: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
    };
    UpdateDressSizeRequest: {
        type: string;
        required: string[];
        properties: {
            name: {
                type: string;
                example: string;
            };
        };
    };
    UpdateDressSizeResponse: {
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
                        example: string;
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
    CreateDressSizeRequest: {
        type: string;
        required: string[];
        properties: {
            name: {
                type: string;
                example: string;
            };
        };
    };
    CreateDressSizeResponse: {
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
                        example: string;
                    };
                    created_by: {
                        type: string[];
                        format: string;
                    };
                    created_at: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
    };
    GetDressSizesResponse: {
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
                    };
                };
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map