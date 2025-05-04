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

export const isAuthError = (error: any): boolean => {
    return error instanceof AppError && error.status === 401;
};

export const isNetworkError = (error: any): boolean => {
    return error instanceof AppError && error.code === 'NETWORK_ERROR';
}; 