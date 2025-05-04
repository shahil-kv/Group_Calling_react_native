export const AUTH_CONFIG = {
    TOKEN_EXPIRY: {
        ACCESS: '15m',
        REFRESH: '7d'
    },
    STORAGE_KEYS: {
        USER: 'auth_user',
        TOKENS: 'auth_tokens'
    },
    ROUTES: {
        LOGIN: '/(auth)/login',
        TABS: '/(tabs)'
    }
} as const;

export type UserRole = 'USER' | 'ADMIN';

export interface User {
    id: number;
    phone_number: string;
    role: UserRole;
    is_premium?: boolean;
    premium_expiry?: string | null;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface ApiResponse<T> {
    data: T;
    message: string;
    status: number;
}

export interface LoginResponse {
    user: User;
    tokens: AuthTokens;
}

export interface RefreshTokenResponse {
    tokens: AuthTokens;
}

export interface PremiumStatusResponse {
    is_premium: boolean;
    premium_expiry: string | null;
} 