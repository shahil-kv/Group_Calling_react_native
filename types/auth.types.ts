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
    user?: User;
}

export interface PremiumStatusResponse {
    is_premium: boolean;
    premium_expiry: string | null;
}

export interface AuthContextType {
    user: User | null;
    tokens: AuthTokens | null;
    isLoading: boolean;
    signIn: (phoneNumber: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshAccessToken: () => Promise<AuthTokens>;
    checkPremiumStatus: () => Promise<void>;
    upgradeToPremium: (plan: "monthly" | "yearly") => Promise<void>;
} 