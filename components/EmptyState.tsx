import React from 'react';
import { Text } from 'react-native';

interface EmptyStateProps {
  isLoading: boolean;
  error: unknown;
  emptyMessage: string;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(
  ({ isLoading, error, emptyMessage }) => {
    if (isLoading) {
      return (
        <Text className="text-center text-gray-500 mt-5 text-base" accessibilityRole="alert">
          Loading...
        </Text>
      );
    }
    if (error) {
      return (
        <Text className="text-center text-red-500 mt-5 text-base" accessibilityRole="alert">
          {typeof error === 'string' ? error : 'Error loading data'}
        </Text>
      );
    }
    return (
      <Text className="text-center text-gray-500 mt-5 text-base" accessibilityRole="alert">
        {emptyMessage}
      </Text>
    );
  }
);
