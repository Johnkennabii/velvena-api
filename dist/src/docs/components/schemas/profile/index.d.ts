declare const _default: {
    CreateProfileRequest: {
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
            role_id: {
                type: string;
                format: string;
                example: string;
            };
            userId: {
                type: string;
                format: string;
                example: string;
            };
        };
    };
    CreateProfileResponse: {
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
                    firstname: {
                        type: string;
                    };
                    lastname: {
                        type: string;
                    };
                    email: {
                        type: string;
                    };
                    phone: {
                        type: string;
                    };
                    role_id: {
                        type: string;
                        format: string;
                    };
                    userId: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
    };
    GetProfilesResponse: {
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
                        role_id: {
                            type: string;
                            format: string;
                        };
                    };
                };
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map