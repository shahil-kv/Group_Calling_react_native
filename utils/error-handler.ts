/**
 * @file error-handler.ts
 * @description Error handling utilities for the application
 * @author System
 */

/**
 * @class AppError
 * @description Custom error class for application-specific errors
 * @extends Error
 * @property {string} code - Error code for identifying the type of error
 * @property {string} message - Human-readable error message
 * @property {number} [status] - HTTP status code if applicable
 */
export class AppError extends Error {
    constructor(
        public code: string,
        message: string,
        public status?: number
    ) {
        super(message);
        this.name = 'AppError';
    }
}

/**
 * @function handleApiError
 * @description Transforms various types of errors into standardized AppError instances
 * @param {any} error - The error to handle
 * @returns {AppError} A standardized AppError instance
 * 
 * @example
 * try {
 *   await apiCall();
 * } catch (error) {
 *   const appError = handleApiError(error);
 *   // Handle the standardized error
 * }
 */
export const handleApiError = (error: any): AppError => {
    if (error instanceof AppError) {
        return error;
    }

    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return new AppError(
            'API_ERROR',
            error.response.data?.message || 'An error occurred',
            error.response.status
        );
    } else if (error.request) {
        // The request was made but no response was received
        return new AppError(
            'NETWORK_ERROR',
            'No response received from server',
            0
        );
    } else {
        // Something happened in setting up the request that triggered an Error
        return new AppError(
            'REQUEST_ERROR',
            error.message || 'Error setting up request',
            0
        );
    }
};

/**
 * @function isAuthError
 * @description Checks if an error is an authentication error (401 status)
 * @param {any} error - The error to check
 * @returns {boolean} True if the error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
    return error instanceof AppError && error.status === 401;
};

/**
 * @function isNetworkError
 * @description Checks if an error is a network-related error
 * @param {any} error - The error to check
 * @returns {boolean} True if the error is a network error
 */
export const isNetworkError = (error: any): boolean => {
    return error instanceof AppError && error.code === 'NETWORK_ERROR';
}; 