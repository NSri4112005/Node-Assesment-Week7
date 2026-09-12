export interface RegisterInput {
    name: string;
    email: string;
    password: string;
    role?: "staff";
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthPayload {
    userId: string;
    email: string;
    role: "admin" | "staff";
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: "admin" | "staff";
    };
}