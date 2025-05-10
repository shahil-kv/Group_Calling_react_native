/**
 * @file useApi.ts
 * @description Custom hooks for making API calls with built-in error handling and loading states
 * @author System
 */

import { ApiErrorResponse, MutationConfig } from '@/types/api.types';
import { handleApiError } from '@/utils/error-handler';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLoader } from '../contexts/LoaderContext';
import { api } from '../utils/api';
import { useToast } from './useToast';

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

interface ApiResponse<T> {
    statusCode: number;
    data: T;
    message: string;
    success: boolean;
}

/**
 * @function usePost
 * @description Hook for making POST requests with built-in error handling and loading states
 * @template TData - Type of the response data
 * @template TVariables - Type of the request variables
 * @param {string} endpoint - API endpoint to call
 * @param {MutationConfig} [config] - Configuration options
 * @returns {UseMutationResult<TData, Error, TVariables>} Mutation result object
 * 
 * @example
 * const { mutate, isLoading } = usePost<ResponseType, RequestType>('/api/endpoint', {
 *   showSuccessToast: true,
 *   showErrorToast: true,
 *   showLoader: true
 * });
 * 
 * // Use the mutation
 * mutate(requestData);
 */
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
                const response = await api.post<ApiResponse<TData>>(endpoint, variables);
                if (showSuccessToast && response.data.message) {
                    toast.showSuccess(response.data.message);
                }
                return response.data;
            } catch (error) {
                const appError = handleApiError(error);
                if (showErrorToast) {
                    toast.showError(appError.message);
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

/**
 * @function useGet
 * @description Hook for making GET requests with built-in error handling and loading states
 * @template TData - Type of the response data
 * @param {string} endpoint - API endpoint to call
 * @param {MutationConfig} [config] - Configuration options
 * @returns {UseMutationResult<TData, Error, void>} Mutation result object
 * 
 * @example
 * const { mutate, isLoading } = useGet<ResponseType>('/api/endpoint', {
 *   showSuccessToast: true,
 *   showErrorToast: true,
 *   showLoader: true
 * });
 * 
 * // Use the mutation
 * mutate();
 */
export const useGet = <TData = any, TVariables = any>(endpoint: string, config?: MutationConfig) => {
    const toast = useToast();
    const { showLoader, hideLoader } = useLoader();
    const { showSuccessToast = false, showErrorToast = true, showLoader: shouldShowLoader = true } = config || {};

    return useMutation({
        mutationFn: async (variables?: TVariables) => {
            try {
                if (shouldShowLoader) {
                    showLoader();
                }
                const response = await api.get<TData>(endpoint, { params: variables });
                if (showSuccessToast) {
                    toast.showSuccess('Data fetched successfully');
                }
                return response.data;
            } catch (error) {
                const appError = handleApiError(error);
                if (showErrorToast) {
                    toast.showError(appError.message);
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
