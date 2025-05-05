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
          <View className="px-2 py-1 bg-green-500 rounded-full">
            <Text className="text-xs font-medium text-white">Completed</Text>
          </View>
        );
      case 'failed':
        return (
          <View className="px-2 py-1 bg-red-500 rounded-full">
            <Text className="text-xs font-medium text-white">Failed</Text>
          </View>
        );
      case 'in-progress':
        return (
          <View className="px-2 py-1 bg-blue-500 rounded-full">
            <Text className="text-xs font-medium text-white">In Progress</Text>
          </View>
        );
    }
  };

  return (
    <View className="p-4 mb-3 bg-white shadow-sm rounded-xl">
      <View className="flex-row items-center justify-between">
        <Text className="font-medium text-gray-900">{title}</Text>
        <Text className="text-xs text-gray-500">{timeAgo}</Text>
      </View>
      <View className="flex-row justify-between items-center mt-2">
        <Text className="text-sm text-gray-600">{contactsReached}</Text>
        {getStatusBadge()}
      </View>
    </View>
  );
};

export default CallHistoryItem;
