import { InternalAxiosRequestConfig } from "axios";

type ValidationError = {
    field: string;
    message: string;
};

type ApiErrorResponse = {
    success: false;
    message: string;
    errors?: ValidationError[];
};

type MutationConfig = {
    invalidateQueriesOnSuccess?: string[];
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    showLoader?: boolean;
};

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

export type { ApiErrorResponse, MutationConfig, ValidationError };
