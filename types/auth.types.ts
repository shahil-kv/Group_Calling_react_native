/**
 * @file auth.types.ts
 * @description Type definitions for authentication-related data structures
 * @author System
 */

/**
 * @type UserRole
 * @description Available user roles in the system
 * @typedef {'USER' | 'ADMIN'} UserRole
 */
export type UserRole = 'USER' | 'ADMIN';

/**
 * @interface User
 * @description Represents a user in the system
 * @property {number} id - Unique identifier for the user
 * @property {string} phone_number - User's phone number
 * @property {UserRole} role - User's role in the system
 * @property {boolean} [is_premium] - Whether the user has premium subscription
 * @property {string | null} [premium_expiry] - Premium subscription expiry date
 */
export interface User {
    id: number;
    phone_number: string;
    role: UserRole;
    is_premium?: boolean;
    premium_expiry?: string | null;
}

/**
 * @interface AuthTokens
 * @description Authentication tokens for API access
 * @property {string} accessToken - Short-lived token for API access
 * @property {string} refreshToken - Long-lived token for refreshing access token
 */
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

/**
 * @interface ApiResponse
 * @description Standard API response structure
 * @template T - Type of the response data
 * @property {T} data - Response data
 * @property {string} message - Response message
 * @property {number} status - HTTP status code
 */
export interface ApiResponse<T> {
    data: T;
    message: string;
    status: number;
}

/**
 * @interface LoginResponse
 * @description Response structure for login API
 * @property {User} user - Authenticated user data
 * @property {AuthTokens} tokens - Authentication tokens
 */
export interface LoginResponse {
    user: User;
    tokens: AuthTokens;
}

/**
 * @interface RefreshTokenResponse
 * @description Response structure for token refresh API
 * @property {AuthTokens} tokens - New authentication tokens
 * @property {User} [user] - Optional updated user data
 */
export interface RefreshTokenResponse {
    tokens: AuthTokens;
    user?: User;
}

/**
 * @interface PremiumStatusResponse
 * @description Response structure for premium status check
 * @property {boolean} is_premium - Whether the user has premium subscription
 * @property {string | null} premium_expiry - Premium subscription expiry date
 */
export interface PremiumStatusResponse {
    is_premium: boolean;
    premium_expiry: string | null;
}

/**
 * @interface AuthContextType
 * @description Type definition for the authentication context
 * @property {User | null} user - Current authenticated user
 * @property {AuthTokens | null} tokens - Current authentication tokens
 * @property {boolean} isLoading - Whether auth state is being loaded
 * @property {(phoneNumber: string, password: string) => Promise<void>} signIn - Function to sign in user
 * @property {() => Promise<void>} signOut - Function to sign out user
 * @property {() => Promise<AuthTokens>} refreshAccessToken - Function to refresh access token
 * @property {() => Promise<void>} checkPremiumStatus - Function to check premium status
 * @property {(plan: "monthly" | "yearly") => Promise<void>} upgradeToPremium - Function to upgrade to premium
 */
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