declare const _default: {
    DeleteContractTypeSoftResponse: {
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
                    deleted_at: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    deleted_by: {
                        type: string[];
                        format: string;
                        example: string;
                    };
                };
                additionalProperties: boolean;
            };
        };
        required: string[];
    };
    DeleteContractTypeHardResponse: {
        type: string;
        description: string;
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
        required: string[];
    };
    UpdateContractTypeRequest: {
        type: string;
        description: string;
        properties: {
            name: {
                type: string;
                description: string;
                example: string;
            };
        };
        required: string[];
    };
    UpdateContractTypeResponse: {
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
                additionalProperties: boolean;
            };
        };
        required: string[];
    };
    CreateContractTypeRequest: {
        type: string;
        properties: {
            name: {
                type: string;
                description: string;
                example: string;
            };
        };
        required: string[];
    };
    ContractType: {
        type: string;
        properties: {
            id: {
                type: string;
                description: string;
                example: string;
            };
            name: {
                type: string;
                description: string;
                example: string;
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
            updated_at: {
                type: string[];
                format: string;
                example: null;
            };
            deleted_at: {
                type: string[];
                format: string;
                example: null;
            };
        };
        required: string[];
    };
    CreateContractTypeResponse: {
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
    ContractTypeResponse: {
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
    GetContractTypesResponse: {
        type: string;
        description: string;
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
                description: string;
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map