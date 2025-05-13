import 'nativewind';
import React, { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface StatusCardProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  status: ReactNode;
  className?: string;
}

const StatusCard = ({ title, actionLabel, onAction, status, className }: StatusCardProps) => {
  return (
    <View className={`p-5 mx-5 bg-primary rounded-lg ${className || ''}`}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-white">{title}</Text>
        {actionLabel && onAction && (
          <TouchableOpacity className="px-3 py-1 rounded-full bg-background" onPress={onAction}>
            <Text className="text-xs font-bold text-text-primary">{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View className="bg-white/20 h-[1] mb-3" />
      {status}
    </View>
  );
};

export default StatusCard;
