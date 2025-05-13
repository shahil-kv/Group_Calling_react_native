import 'nativewind';
import React from 'react';
import { Text, View } from 'react-native';

interface CallHistoryItemProps {
  title: string;
  timeAgo: string;
  contactsReached: string;
  status: 'completed' | 'failed' | 'in-progress';
}

const CallHistoryItem = ({ title, timeAgo, contactsReached, status }: CallHistoryItemProps) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return (
          <View className="px-2 py-1 rounded-full bg-success">
            <Text className="text-xs font-medium text-white">Completed</Text>
          </View>
        );
      case 'failed':
        return (
          <View className="px-2 py-1 rounded-full bg-error">
            <Text className="text-xs font-medium text-white">Failed</Text>
          </View>
        );
      case 'in-progress':
        return (
          <View className="px-2 py-1 rounded-full bg-info">
            <Text className="text-xs font-medium text-white">In Progress</Text>
          </View>
        );
    }
  };

  return (
    <View className="p-4 mb-3 shadow-sm bg-tertiary rounded-xl">
      <View className="flex-row items-center justify-between">
        <Text className="font-medium text-text-primary">{title}</Text>
        <Text className="text-xs text-text-secondary">{timeAgo}</Text>
      </View>
      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-sm text-text-secondary">{contactsReached}</Text>
        {getStatusBadge()}
      </View>
    </View>
  );
};

export default CallHistoryItem;
