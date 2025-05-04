import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError, isAxiosError } from 'axios';
import { useLoader } from '../contexts/LoaderContext';
import { useToast } from './useToast';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

const formatErrorMessage = (error: unknown): string => {
    try {
        if (error instanceof Error) {
            const parsedError = JSON.parse(error.message) as ApiErrorResponse;
            if (parsedError.errors && parsedError.errors.length > 0) {
                return parsedError.errors.map(err => err.message).join('\n');
            }
            return parsedError.message;
        }
        return 'An unexpected error occurred';
    } catch {
        return error instanceof Error ? error.message : 'An unexpected error occurred';
    }
};

const handleApiError = (error: unknown): string => {
    if (isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        if (axiosError.response?.data) {
            const errorData = axiosError.response.data;
            if (errorData.errors && errorData.errors.length > 0) {
                return errorData.errors.map(err => err.message).join('\n');
            }
            return errorData.message || axiosError.message;
        }
        return axiosError.message;
    }
    return error instanceof Error ? error.message : 'An unexpected error occurred';
};

export const usePost = <TData = unknown, TVariables = unknown>(
    endpoint: string,
    config?: MutationConfig
) => {
    const queryClient = useQueryClient();
    const toast = useToast();
    const { showLoader, hideLoader } = useLoader();
    const { showSuccessToast = false, showErrorToast = true, showLoader: shouldShowLoader = true } = config || {};

    return useMutation({
        mutationFn: async (variables: TVariables) => {
            try {
                if (shouldShowLoader) {
                    showLoader();
                }
                const response = await api.post<TData>(endpoint, variables);
                if (showSuccessToast) {
                    toast.showSuccess('Operation completed successfully');
                }
                return response.data;
            } catch (error) {
                const errorMessage = handleApiError(error);
                if (showErrorToast) {
                    toast.showError(errorMessage);
                }
                throw error;
            } finally {
                if (shouldShowLoader) {
                    hideLoader();
                }
            }
        },
        onSuccess: () => {
            if (config?.invalidateQueriesOnSuccess) {
                config.invalidateQueriesOnSuccess.forEach((queryKey) => {
                    queryClient.invalidateQueries({ queryKey: [queryKey] });
                });
            }
        },
    });
};

export const useGet = <TData = unknown>(endpoint: string, config?: MutationConfig) => {
    const toast = useToast();
    const { showLoader, hideLoader } = useLoader();
    const { showSuccessToast = false, showErrorToast = true, showLoader: shouldShowLoader = true } = config || {};

    return useMutation({
        mutationFn: async () => {
            try {
                if (shouldShowLoader) {
                    showLoader();
                }
                const response = await api.get<TData>(endpoint);
                if (showSuccessToast) {
                    toast.showSuccess('Data fetched successfully');
                }
                return response.data;
            } catch (error) {
                const errorMessage = handleApiError(error);
                if (showErrorToast) {
                    toast.showError(errorMessage);
                }
                throw error;
            } finally {
                if (shouldShowLoader) {
                    hideLoader();
                }
            }
        },
    });
};

export { formatErrorMessage };
