interface User {
    id: number;
    phone_number: string;
    role: string;
    is_premium?: boolean;
    premium_expiry?: string | null;
}

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

interface ApiResponse<T> {
    data: T;
    message: string;
    status: number;
}

interface LoginResponse {
    user: User;
    tokens: AuthTokens;
}

interface RefreshTokenResponse {
    tokens: AuthTokens;
}

interface PremiumStatusResponse {
    is_premium: boolean;
    premium_expiry: string | null;
}
interface AuthContextType {
    user: User | null;
    tokens: AuthTokens | null;
    isLoading: boolean;
    signIn: (phoneNumber: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshAccessToken: () => Promise<void>;
    checkPremiumStatus: () => Promise<void>;
    upgradeToPremium: (plan: "monthly" | "yearly") => Promise<void>;
}

export type { ApiResponse, AuthContextType, AuthTokens, LoginResponse, PremiumStatusResponse, RefreshTokenResponse, User };

