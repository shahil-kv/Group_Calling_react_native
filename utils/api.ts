import axios from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { CustomAxiosRequestConfig } from '../types/api.types';
import { ApiResponse } from '../types/auth.types';

// Use environment variable or fallback to your actual backend server
const BASE_URL = process.env.EXPO_PUBLIC_API_URL as string;

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Add request interceptor to add auth token and handle token expiry
api.interceptors.request.use(
    async (config) => {
        try {
            const accessToken = await SecureStore.getItemAsync('access_token');
            const tokenExpiry = await SecureStore.getItemAsync('token_expiry');
            const refreshToken = await SecureStore.getItemAsync('refresh_token');

            if (accessToken && tokenExpiry && refreshToken) {
                const expiryDate = new Date(tokenExpiry);
                const now = new Date();
                const isExpired = now >= expiryDate;

                if (isExpired) {
                    // Token is expired, refresh it
                    try {
                        const response = await axios.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>(
                            `${BASE_URL}/user/refresh-token`,
                            { refreshToken },
                            { timeout: 10000 }
                        );

                        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
                        const newExpiry = new Date(Date.now() + 15 * 60 * 1000); // Assume 15-minute expiry

                        await SecureStore.setItemAsync('access_token', newAccessToken);
                        await SecureStore.setItemAsync('refresh_token', newRefreshToken);
                        await SecureStore.setItemAsync('token_expiry', newExpiry.toISOString());

                        config.headers.Authorization = `Bearer ${newAccessToken}`;
                    } catch (refreshError) {
                        console.error('Token refresh failed in request interceptor:', refreshError);
                        await SecureStore.deleteItemAsync('access_token');
                        await SecureStore.deleteItemAsync('refresh_token');
                        await SecureStore.deleteItemAsync('token_expiry');
                        router.replace('/(auth)/login');
                        return Promise.reject(refreshError);
                    }
                } else {
                    // Token is still valid
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }
            }
            return config;
        } catch (error) {
            console.error('Error accessing SecureStore:', error);
            return config; // Continue with the request even if SecureStore fails
        }
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor to handle 401 errors (as a fallback)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await SecureStore.getItemAsync('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>(
                    `${BASE_URL}/user/refresh-token`,
                    { refreshToken },
                    { timeout: 10000 }
                );

                const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
                const newExpiry = new Date(Date.now() + 15 * 60 * 1000); // Assume 15-minute expiry

                await SecureStore.setItemAsync('access_token', accessToken);
                await SecureStore.setItemAsync('refresh_token', newRefreshToken);
                await SecureStore.setItemAsync('token_expiry', newExpiry.toISOString());

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error('Token refresh error in response interceptor:', refreshError);
                await SecureStore.deleteItemAsync('access_token');
                await SecureStore.deleteItemAsync('refresh_token');
                await SecureStore.deleteItemAsync('token_expiry');
                router.replace('/(auth)/login');
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);