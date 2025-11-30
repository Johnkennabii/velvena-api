declare const _default: {
    HardDeleteUserResponse: {
        type: string;
        properties: {
            success: {
                type: string;
            };
            data: {
                type: string;
                properties: {
                    message: {
                        type: string;
                        example: string;
                    };
                };
            };
        };
    };
    SoftDeleteUserResponse: {
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
    UpdateUserRequest: {
        type: string;
        properties: {
            password: {
                type: string;
                example: string;
            };
            profile: {
                type: string;
                properties: {
                    firstname: {
                        type: string;
                    };
                    lastname: {
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
    UpdateUserResponse: {
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
                    email: {
                        type: string;
                        format: string;
                    };
                    profile: {
                        type: string;
                        properties: {
                            firstname: {
                                type: string;
                            };
                            lastname: {
                                type: string;
                            };
                            role: {
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
    };
    GetUserResponse: {
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
                    email: {
                        type: string;
                        format: string;
                    };
                    profile: {
                        type: string;
                        properties: {
                            firstname: {
                                type: string;
                            };
                            lastname: {
                                type: string;
                            };
                            role: {
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
    };
    GetUsersResponse: {
        type: string;
        properties: {
            success: {
                type: string;
            };
            count: {
                type: string;
                example: number;
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
                        email: {
                            type: string;
                            format: string;
                        };
                        profile: {
                            type: string;
                            properties: {
                                firstname: {
                                    type: string;
                                };
                                lastname: {
                                    type: string;
                                };
                                role: {
                                    type: string;
                                    properties: {
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
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map