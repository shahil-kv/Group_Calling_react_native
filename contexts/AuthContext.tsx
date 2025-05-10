/**
 * @file AuthContext.tsx
 * @description Authentication context provider for managing user authentication state and operations
 * @author System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AUTH_CONFIG } from '../config/auth.config';
import { usePost } from '../hooks/useApi';
import {
  ApiResponse,
  AuthContextType,
  AuthTokens,
  LoginResponse,
  PremiumStatusResponse,
  RefreshTokenResponse,
  User,
} from '../types/auth.types';
import { api } from '../utils/api';
import { useLoader } from './LoaderContext';

/**
 * @context AuthContext
 * @description React context for authentication state and operations
 * @type {React.Context<AuthContextType | undefined>}
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * @component AuthProvider
 * @description Provider component that manages authentication state and provides auth-related functions
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to auth context
 *
 * @example
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();

  const { mutateAsync: login } = usePost<LoginResponse>('/user/login', {
    invalidateQueriesOnSuccess: ['users', 'auth'],
    showErrorToast: true,
    showSuccessToast: true,
    showLoader: true,
  });

  const { mutateAsync: refreshToken } = usePost<RefreshTokenResponse>('/user/refresh-token', {
    invalidateQueriesOnSuccess: ['users', 'auth'],
    showErrorToast: false,
    showSuccessToast: false,
    showLoader: false,
  });

  const { mutateAsync: logout } = usePost<null>('user/logout', {
    invalidateQueriesOnSuccess: ['users', 'auth'],
    showErrorToast: true,
    showSuccessToast: true,
    showLoader: true,
  });

  const { mutateAsync: checkPremium } = usePost<PremiumStatusResponse>('/user/premium-status', {
    invalidateQueriesOnSuccess: ['users', 'auth'],
    showErrorToast: true,
    showSuccessToast: false,
    showLoader: false,
  });

  const { mutateAsync: upgradePremium } = usePost<PremiumStatusResponse>('/user/upgrade-premium', {
    invalidateQueriesOnSuccess: ['users', 'auth'],
    showErrorToast: true,
    showSuccessToast: true,
    showLoader: true,
  });

  /**
   * @function loadStoredAuth
   * @description Loads and validates stored authentication tokens on app startup
   * @private
   * @async
   * @returns {Promise<void>}
   *
   * @flow
   * 1. Check for stored refresh token
   * 2. If no token exists, clear state and redirect to login
   * 3. If token exists, attempt to refresh it
   * 4. On successful refresh, store new tokens and user data
   * 5. On failure, clear state and redirect to login
   */
  const loadStoredAuth = useCallback(async () => {
    try {
      const storedRefreshToken = await AsyncStorage.getItem('refresh_token');
      const storedUserData = await AsyncStorage.getItem('user_data');

      if (!storedRefreshToken) {
        setUser(null);
        setTokens(null);
        router.replace(AUTH_CONFIG.ROUTES.LOGIN);
        return;
      }

      try {
        const response = await refreshToken({
          refreshToken: storedRefreshToken,
        });

        const { tokens: newTokens } = response.data;

        // Store new tokens
        await AsyncStorage.setItem('access_token', newTokens.accessToken);
        await AsyncStorage.setItem('refresh_token', newTokens.refreshToken);
        setTokens(newTokens);

        // Use stored user data if available
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          setUser(userData);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        setUser(null);
        setTokens(null);
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'userId', 'user_data']);
        router.replace(AUTH_CONFIG.ROUTES.LOGIN);
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      setUser(null);
      setTokens(null);
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'userId', 'user_data']);
      router.replace(AUTH_CONFIG.ROUTES.LOGIN);
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken]);

  /**
   * @function signIn
   * @description Authenticates a user with phone number and password
   * @param {string} phoneNumber - User's phone number
   * @param {string} password - User's password
   * @returns {Promise<void>}
   * @throws {Error} If authentication fails
   *
   * @flow
   * 1. Call login API with credentials
   * 2. Store received tokens in AsyncStorage
   * 3. Update user state and tokens
   * 4. Redirect to main app
   */
  const signIn = async (phoneNumber: string, password: string) => {
    try {
      const response = await login({ phoneNumber, password });

      if (!response?.data) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response structure from login API');
      }

      const { user, tokens: newTokens } = response.data;

      if (!user || !newTokens) {
        console.error('Missing data in response:', { user, tokens: newTokens });
        throw new Error('Missing user or tokens in login response');
      }

      // Store tokens and user data
      await AsyncStorage.setItem('access_token', newTokens.accessToken);
      await AsyncStorage.setItem('refresh_token', newTokens.refreshToken);
      await AsyncStorage.setItem('userId', user.id.toString());
      await AsyncStorage.setItem('user_data', JSON.stringify(user));

      setUser(user);
      setTokens(newTokens);

      router.replace(AUTH_CONFIG.ROUTES.TABS);
    } catch (error) {
      console.error('Login error details:', error);
      throw error;
    }
  };

  /**
   * @function signOut
   * @description Logs out the current user and clears all auth data
   * @returns {Promise<void>}
   *
   * @flow
   * 1. Call logout API
   * 2. Clear stored tokens from AsyncStorage
   * 3. Clear user state and tokens
   * 4. Redirect to login screen
   */
  const signOut = async () => {
    try {
      await logout({});
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      try {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'userId', 'user_data']);
        setUser(null);
        setTokens(null);
        router.replace(AUTH_CONFIG.ROUTES.LOGIN);
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
        router.replace(AUTH_CONFIG.ROUTES.LOGIN);
      }
    }
  };

  /**
   * @function checkPremiumStatus
   * @description Checks and updates the user's premium subscription status
   * @returns {Promise<void>}
   * @throws {Error} If status check fails
   */
  const checkPremiumStatus = async () => {
    try {
      const response = await checkPremium({});
      const { is_premium, premium_expiry } = response.data;

      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          is_premium,
          premium_expiry,
        };
      });
    } catch (error) {
      console.error('Premium status check error:', error);
      throw error;
    }
  };

  /**
   * @function upgradeToPremium
   * @description Upgrades user account to premium subscription
   * @param {'monthly' | 'yearly'} plan - Subscription plan type
   * @returns {Promise<void>}
   * @throws {Error} If upgrade fails
   */
  const upgradeToPremium = async (plan: 'monthly' | 'yearly') => {
    try {
      const response = await upgradePremium({ plan });
      const { is_premium, premium_expiry } = response.data;

      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          is_premium,
          premium_expiry,
        };
      });
    } catch (error) {
      console.error('Premium upgrade error:', error);
      throw error;
    }
  };

  /**
   * @function refreshAccessToken
   * @description Refreshes the access token using the refresh token
   * @returns {Promise<AuthTokens>} New auth tokens
   * @throws {Error} If refresh fails
   *
   * @flow
   * 1. Check for existing refresh token
   * 2. Call refresh token API
   * 3. Update stored tokens
   * 4. If refresh fails, sign out user
   */
  const refreshAccessToken = async () => {
    try {
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<ApiResponse<RefreshTokenResponse>>('/user/refresh-token', {
        refreshToken: tokens.refreshToken,
      });

      const { tokens: newTokens } = response.data.data;
      setTokens(newTokens);
      return newTokens;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await signOut();
      throw error;
    }
  };

  // Only check auth on initial load
  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    signIn,
    signOut,
    refreshAccessToken,
    checkPremiumStatus,
    upgradeToPremium,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * @hook useAuth
 * @description Custom hook to access authentication context
 * @returns {AuthContextType} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * const { user, signIn, signOut } = useAuth();
 *
 * // Sign in
 * await signIn('+1234567890', 'password');
 *
 * // Check if user is premium
 * if (user?.is_premium) {
 *   // Handle premium features
 * }
 *
 * // Sign out
 * await signOut();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
