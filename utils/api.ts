import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CustomAxiosRequestConfig } from '../types/api.types';
import { ApiResponse } from '../types/auth.types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
console.log('Current BASE_URL:', BASE_URL);

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        console.log(BASE_URL);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
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
                const response = await api.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>('/user/refresh-token', {
                    refreshToken,
                });
                const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
                await AsyncStorage.setItem('access_token', accessToken);
                await AsyncStorage.setItem('refresh_token', newRefreshToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
); 