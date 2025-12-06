export declare const prospectRequestSchemas: {
    DeleteProspectRequestResponse: {
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
    UpdateProspectRequestRequest: {
        type: string;
        properties: {
            status: {
                type: string;
                enum: string[];
                example: string;
            };
            notes: {
                type: string;
                example: string;
            };
            dresses: {
                type: string;
                items: {
                    type: string;
                    required: string[];
                    properties: {
                        dress_id: {
                            type: string;
                            format: string;
                            example: string;
                        };
                        rental_start_date: {
                            type: string;
                            format: string;
                            example: string;
                        };
                        rental_end_date: {
                            type: string;
                            format: string;
                            example: string;
                        };
                        notes: {
                            type: string;
                            example: string;
                        };
                    };
                };
            };
        };
    };
    UpdateProspectRequestResponse: {
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
    GetProspectRequestByIdResponse: {
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
    GetProspectRequestsResponse: {
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
    CreateProspectRequestRequest: {
        type: string;
        required: string[];
        properties: {
            dresses: {
                type: string;
                items: {
                    type: string;
                    required: string[];
                    properties: {
                        dress_id: {
                            type: string;
                            format: string;
                            example: string;
                        };
                        rental_start_date: {
                            type: string;
                            format: string;
                            example: string;
                        };
                        rental_end_date: {
                            type: string;
                            format: string;
                            example: string;
                        };
                        notes: {
                            type: string;
                            example: string;
                        };
                    };
                };
            };
            notes: {
                type: string;
                example: string;
            };
            status: {
                type: string;
                enum: string[];
                example: string;
            };
        };
    };
    CreateProspectRequestResponse: {
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
    ProspectRequest: {
        type: string;
        properties: {
            id: {
                type: string;
                format: string;
                example: string;
            };
            request_number: {
                type: string;
                example: string;
            };
            prospect_id: {
                type: string;
                format: string;
                example: string;
            };
            status: {
                type: string;
                enum: string[];
                example: string;
            };
            total_estimated_ht: {
                type: string;
                example: number;
            };
            total_estimated_ttc: {
                type: string;
                example: number;
            };
            notes: {
                type: string;
                example: string;
            };
            created_at: {
                type: string;
                format: string;
                example: string;
            };
            updated_at: {
                type: string;
                format: string;
                example: string;
            };
            dresses: {
                type: string;
                items: {
                    $ref: string;
                };
            };
        };
    };
    ProspectRequestDress: {
        type: string;
        properties: {
            id: {
                type: string;
                format: string;
                example: string;
            };
            request_id: {
                type: string;
                format: string;
                example: string;
            };
            dress_id: {
                type: string;
                format: string;
                example: string;
            };
            rental_start_date: {
                type: string;
                format: string;
                example: string;
            };
            rental_end_date: {
                type: string;
                format: string;
                example: string;
            };
            rental_days: {
                type: string;
                example: number;
            };
            estimated_price_ht: {
                type: string;
                example: number;
            };
            estimated_price_ttc: {
                type: string;
                example: number;
            };
            notes: {
                type: string;
                example: string;
            };
            created_at: {
                type: string;
                format: string;
                example: string;
            };
            dress: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                    };
                    name: {
                        type: string;
                    };
                    reference: {
                        type: string;
                    };
                    price_per_day_ht: {
                        type: string;
                    };
                    price_per_day_ttc: {
                        type: string;
                    };
                    type: {
                        type: string;
                        properties: {
                            name: {
                                type: string;
                            };
                        };
                    };
                    size: {
                        type: string;
                        properties: {
                            name: {
                                type: string;
                            };
                        };
                    };
                    color: {
                        type: string;
                        properties: {
                            name: {
                                type: string;
                            };
                        };
                    };
                    condition: {
                        type: string;
                        properties: {
                            name: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=index.d.ts.map