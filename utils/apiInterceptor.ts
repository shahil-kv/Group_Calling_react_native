import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any = null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

export const createAxiosInstance = (baseURL: string): AxiosInstance => {
    const instance = axios.create({
        baseURL,
        withCredentials: true,
    });

    instance.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
            const tokens = await AsyncStorage.getItem('auth_tokens');
            if (tokens) {
                const { accessToken } = JSON.parse(tokens);
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    instance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest = error.config as CustomAxiosRequestConfig;
            if (!originalRequest) {
                return Promise.reject(error);
            }

            if (error.response?.status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then((token) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return instance(originalRequest);
                        })
                        .catch((err) => Promise.reject(err));
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const tokens = await AsyncStorage.getItem('auth_tokens');
                    if (!tokens) {
                        throw new Error('No refresh token available');
                    }

                    const { refreshToken } = JSON.parse(tokens);
                    const response = await instance.post('/user/refresh-token', { refreshToken });
                    const { tokens: newTokens } = response.data;

                    await AsyncStorage.setItem('auth_tokens', JSON.stringify(newTokens));
                    instance.defaults.headers.common.Authorization = `Bearer ${newTokens.accessToken}`;
                    processQueue(null, newTokens.accessToken);

                    return instance(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    await AsyncStorage.removeItem('auth_tokens');
                    await AsyncStorage.removeItem('auth_user');
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        }
    );

    return instance;
}; 