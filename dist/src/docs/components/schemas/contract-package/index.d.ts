declare const _default: {
    HardDeleteContractPackageResponse: {
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
    SoftDeleteContractPackageResponse: {
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
    };
    CreateContractPackageRequest: {
        type: string;
        required: string[];
        properties: {
            name: {
                type: string;
                example: string;
                description: string;
            };
            num_dresses: {
                type: string;
                example: number;
                description: string;
            };
            price_ht: {
                type: string;
                example: number;
                description: string;
            };
            price_ttc: {
                type: string;
                example: number;
                description: string;
            };
            addon_ids: {
                type: string;
                items: {
                    type: string;
                    format: string;
                };
                example: string[];
                description: string;
            };
        };
    };
    CreatedAddonReference: {
        type: string;
        description: string;
        properties: {
            addon: {
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
                    price_ht: {
                        type: string;
                        example: number;
                    };
                    price_ttc: {
                        type: string;
                        example: number;
                    };
                };
            };
        };
    };
    CreatedContractPackage: {
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
            num_dresses: {
                type: string;
                example: number;
            };
            price_ht: {
                type: string;
                example: number;
            };
            price_ttc: {
                type: string;
                example: number;
            };
            created_at: {
                type: string;
                format: string;
                example: string;
            };
            created_by: {
                type: string[];
                format: string;
                example: string;
            };
            addons: {
                type: string;
                items: {
                    $ref: string;
                };
            };
        };
    };
    CreateContractPackageResponse: {
        type: string;
        description: string;
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
    UpdateContractPackageRequest: {
        type: string;
        description: string;
        properties: {
            name: {
                type: string;
                example: string;
                description: string;
            };
            num_dresses: {
                type: string;
                example: number;
                description: string;
            };
            price_ht: {
                type: string;
                example: number;
                description: string;
            };
            price_ttc: {
                type: string;
                example: number;
                description: string;
            };
            addon_ids: {
                type: string;
                items: {
                    type: string;
                    format: string;
                };
                example: string[];
                description: string;
            };
        };
    };
    UpdatedAddonReference: {
        type: string;
        description: string;
        properties: {
            addon: {
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
                    price_ht: {
                        type: string;
                        example: number;
                    };
                    price_ttc: {
                        type: string;
                        example: number;
                    };
                };
            };
        };
    };
    UpdatedContractPackage: {
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
            num_dresses: {
                type: string;
                example: number;
            };
            price_ht: {
                type: string;
                example: number;
            };
            price_ttc: {
                type: string;
                example: number;
            };
            updated_at: {
                type: string;
                format: string;
                example: string;
            };
            updated_by: {
                type: string[];
                format: string;
                example: string;
            };
            addons: {
                type: string;
                items: {
                    $ref: string;
                };
            };
        };
    };
    UpdateContractPackageResponse: {
        type: string;
        description: string;
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
    ContractAddonDetail: {
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
        };
    };
    ContractPackageDetail: {
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
            description: {
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
            created_at: {
                type: string;
                format: string;
                example: string;
            };
            addons: {
                type: string;
                items: {
                    $ref: string;
                };
            };
        };
    };
    GetContractPackageByIdResponse: {
        type: string;
        description: string;
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
    ContractAddon: {
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
        };
    };
    ContractPackageListItem: {
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
            description: {
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
            created_at: {
                type: string;
                format: string;
                example: string;
            };
            addons: {
                type: string;
                items: {
                    $ref: string;
                };
            };
        };
    };
    GetContractPackagesResponse: {
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
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map