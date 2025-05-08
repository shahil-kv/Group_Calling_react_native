import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CustomAxiosRequestConfig } from '../types/api.types';
import { ApiResponse } from '../types/auth.types';

// Use environment variable or fallback to your actual backend server
const BASE_URL = process.env.EXPO_PUBLIC_API_URL as string

console.log('Current BASE_URL:', BASE_URL);

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Add request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            console.log('Making request to:', BASE_URL + config.url);

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        } catch (error) {
            console.error('Error accessing AsyncStorage:', error);
            // Continue with the request even if AsyncStorage fails
            return config;
        }
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await AsyncStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await api.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>('/user/refresh-token', {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
                
                try {
                    await AsyncStorage.setItem('access_token', accessToken);
                    await AsyncStorage.setItem('refresh_token', newRefreshToken);
                } catch (storageError) {
                    console.error('Error storing tokens:', storageError);
                }

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error('Token refresh error:', refreshError);
                try {
                    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
                } catch (storageError) {
                    console.error('Error removing tokens:', storageError);
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
); 