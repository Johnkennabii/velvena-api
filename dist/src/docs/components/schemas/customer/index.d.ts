declare const _default: {
    HardDeleteCustomerResponse: {
        type: string;
        properties: {
            success: {
                type: string;
            };
            message: {
                type: string;
                example: string;
            };
        };
    };
    SoftDeleteCustomerResponse: {
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
                    deleted_at: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
    };
    UpdateCustomerRequest: {
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
        };
    };
    UpdateCustomerResponse: {
        type: string;
        properties: {
            success: {
                type: string;
            };
            data: {
                $ref: string;
            };
        };
    };
    CreateCustomerRequest: {
        type: string;
        required: string[];
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
        };
    };
    CreateCustomerResponse: {
        type: string;
        properties: {
            success: {
                type: string;
            };
            data: {
                $ref: string;
            };
        };
    };
    GetCustomerByIdResponse: {
        type: string;
        properties: {
            success: {
                type: string;
            };
            data: {
                $ref: string;
            };
        };
    };
    GetCustomersResponse: {
        type: string;
        properties: {
            success: {
                type: string;
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
            data: {
                type: string;
                items: {
                    $ref: string;
                };
            };
        };
    };
    Customer: {
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
            created_at: {
                type: string;
                format: string;
            };
            updated_at: {
                type: string[];
                format: string;
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map