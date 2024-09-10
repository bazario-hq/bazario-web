/**
 * Generated from openapi/openapi.json (bazario-hq/bazario-api@bd3fc7059582eeb4f7f7f5e34857cffeba70fe64).
 * Do not edit by hand: run `npm run api:generate`.
 */

export interface paths {
    "/auth/signup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a buyer account */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: email */
                        email: string;
                        password: string;
                        name: string;
                    };
                };
            };
            responses: {
                /** @description Account created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AuthResponse"];
                    };
                };
                /** @description Invalid request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Email taken */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Log in with email and password */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: email */
                        email: string;
                        password: string;
                    };
                };
            };
            responses: {
                /** @description Logged in */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AuthResponse"];
                    };
                };
                /** @description Invalid request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Bad credentials */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Current user profile */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Profile */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Me"];
                    };
                };
                /** @description Not authenticated */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Full category tree */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Category tree */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            categories: components["schemas"]["CategoryNode"][];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Search and browse products */
        get: {
            parameters: {
                query?: {
                    q?: string;
                    category?: string;
                    seller?: string;
                    minPrice?: number | null;
                    maxPrice?: number | null;
                    minRating?: number | null;
                    inStock?: "true" | "false";
                    sort?: "newest" | "price_asc" | "price_desc" | "rating" | "popular";
                    page?: number;
                    pageSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Search results */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProductSearchResponse"];
                    };
                };
                /** @description Invalid request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/products/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Product detail */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Product */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProductDetail"];
                    };
                };
                /** @description Invalid request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Error: {
            error: {
                code: string;
                message: string;
                details?: unknown;
            };
        };
        PageMeta: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        Image: {
            id: number;
            url: string;
            thumbUrl: string;
            mediumUrl: string;
            largeUrl: string;
            width: number;
            height: number;
            altText: string | null;
            position: number;
        };
        SellerSummary: {
            id: number;
            storeName: string;
            slug: string;
        };
        ShippingAddress: {
            fullName: string;
            line1: string;
            line2?: string | null;
            city: string;
            postalCode: string;
            country: string;
            phone?: string | null;
        };
        Me: {
            id: number;
            email: string;
            name: string;
            /** @enum {string} */
            role: "buyer" | "seller" | "admin";
            createdAt: string;
            seller: {
                id: number;
                storeName: string;
                slug: string;
                /** @enum {string} */
                status: "pending" | "active" | "suspended";
            } | null;
        };
        AuthResponse: {
            accessToken: string;
            refreshToken: string;
            expiresIn: string;
            user: components["schemas"]["Me"];
        };
        CategoryNode: {
            id: number;
            name: string;
            slug: string;
            children: components["schemas"]["CategoryNode"][];
        };
        CategoryRef: {
            id: number;
            name: string;
            slug: string;
        };
        ProductCard: {
            id: number;
            name: string;
            slug: string;
            description: string;
            priceCents: number;
            compareAtCents: number | null;
            currency: string;
            ratingAvg: number;
            ratingCount: number;
            stock: number;
            specs: {
                [key: string]: string;
            };
            image: components["schemas"]["Image"] | null;
            seller: components["schemas"]["SellerSummary"];
            categoryId: number;
            publishedAt: string | null;
        };
        ProductSearchResponse: {
            items: components["schemas"]["ProductCard"][];
            meta: components["schemas"]["PageMeta"];
            facets: {
                categories: {
                    id: number;
                    name: string;
                    slug: string;
                    count: number;
                }[];
            };
        };
        ProductDetail: {
            id: number;
            name: string;
            slug: string;
            description: string;
            priceCents: number;
            compareAtCents: number | null;
            currency: string;
            stock: number;
            /** @enum {string} */
            status: "draft" | "active" | "archived";
            specs: {
                [key: string]: string;
            };
            ratingAvg: number;
            ratingCount: number;
            /** @example {
             *       "1": 0,
             *       "2": 1,
             *       "3": 0,
             *       "4": 3,
             *       "5": 12
             *     } */
            ratingHistogram: {
                [key: string]: number;
            };
            images: components["schemas"]["Image"][];
            seller: components["schemas"]["SellerSummary"] & {
                ratingAvg: number | null;
            };
            category: components["schemas"]["CategoryRef"];
            breadcrumb: components["schemas"]["CategoryRef"][];
            related: components["schemas"]["ProductCard"][];
            inWishlist: boolean;
            publishedAt: string | null;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
