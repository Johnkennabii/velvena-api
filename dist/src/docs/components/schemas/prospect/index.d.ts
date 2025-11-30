export declare const prospectSchemas: {
    ConvertProspectResponse: {
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
                type: string;
                properties: {
                    prospect: {
                        $ref: string;
                    };
                    customer: {
                        type: string;
                        properties: {
                            id: {
                                type: string;
                                format: string;
                            };
                            firstname: {
                                type: string;
                            };
                            lastname: {
                                type: string;
                            };
                            email: {
                                type: string;
                                format: string;
                            };
                            phone: {
                                type: string;
                                nullable: boolean;
                            };
                            created_at: {
                                type: string;
                                format: string;
                            };
                        };
                    };
                };
            };
        };
    };
    HardDeleteProspectResponse: {
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
    SoftDeleteProspectResponse: {
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
    UpdateProspectRequest: {
        type: string;
        properties: {
            firstname: {
                type: string;
            };
            lastname: {
                type: string;
            };
            email: {
                type: string;
                format: string;
            };
            phone: {
                type: string;
            };
            birthday: {
                type: string;
                format: string;
            };
            country: {
                type: string;
            };
            city: {
                type: string;
            };
            address: {
                type: string;
            };
            postal_code: {
                type: string;
            };
            status: {
                type: string;
            };
            source: {
                type: string;
            };
            notes: {
                type: string;
            };
        };
    };
    UpdateProspectResponse: {
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
    CreateProspectRequest: {
        type: string;
        required: string[];
        properties: {
            firstname: {
                type: string;
                example: string;
            };
            lastname: {
                type: string;
                example: string;
            };
            email: {
                type: string;
                format: string;
                example: string;
            };
            phone: {
                type: string;
                example: string;
            };
            birthday: {
                type: string;
                format: string;
                example: string;
            };
            country: {
                type: string;
                example: string;
            };
            city: {
                type: string;
                example: string;
            };
            address: {
                type: string;
                example: string;
            };
            postal_code: {
                type: string;
                example: string;
            };
            status: {
                type: string;
                example: string;
            };
            source: {
                type: string;
                example: string;
            };
            notes: {
                type: string;
                example: string;
            };
        };
    };
    CreateProspectResponse: {
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
    GetProspectResponse: {
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
    GetProspectsResponse: {
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
            page: {
                type: string;
                example: number;
            };
            limit: {
                type: string;
                example: number;
            };
            total: {
                type: string;
                example: number;
            };
        };
    };
    Prospect: {
        type: string;
        properties: {
            id: {
                type: string;
                format: string;
            };
            firstname: {
                type: string;
            };
            lastname: {
                type: string;
            };
            email: {
                type: string;
                format: string;
            };
            phone: {
                type: string;
                nullable: boolean;
            };
            birthday: {
                type: string;
                format: string;
                nullable: boolean;
            };
            country: {
                type: string;
                nullable: boolean;
            };
            city: {
                type: string;
                nullable: boolean;
            };
            address: {
                type: string;
                nullable: boolean;
            };
            postal_code: {
                type: string;
                nullable: boolean;
            };
            status: {
                type: string;
                example: string;
            };
            source: {
                type: string;
                nullable: boolean;
            };
            notes: {
                type: string;
                nullable: boolean;
            };
            created_at: {
                type: string;
                format: string;
            };
            created_by: {
                type: string;
                format: string;
                nullable: boolean;
            };
            updated_at: {
                type: string;
                format: string;
                nullable: boolean;
            };
            updated_by: {
                type: string;
                format: string;
                nullable: boolean;
            };
            deleted_at: {
                type: string;
                format: string;
                nullable: boolean;
            };
            deleted_by: {
                type: string;
                format: string;
                nullable: boolean;
            };
            converted_at: {
                type: string;
                format: string;
                nullable: boolean;
            };
            converted_by: {
                type: string;
                format: string;
                nullable: boolean;
            };
            converted_to: {
                type: string;
                format: string;
                nullable: boolean;
            };
        };
    };
};
//# sourceMappingURL=index.d.ts.map