import { InternalAxiosRequestConfig } from "axios";

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
} 