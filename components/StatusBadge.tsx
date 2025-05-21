import { StatusStyle, getStatusStyle } from '@/utils/getStatusStyle';
import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

interface StatusBadgeProps {
  status: string | undefined;
  style?: StatusStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status, style }) => {
  const { color, bgColor, icon } = style || getStatusStyle(status);
  const statusText = status || 'In Progress';
  return (
    <View
      className={`flex-row items-center px-2 py-1 rounded-full ${bgColor}`}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Status: ${statusText}`}
    >
      <Icon name={icon} size={16} color={color.replace('text-', '')} />
      <Text className={`text-sm font-medium uppercase ml-2 ${color}`}>{statusText}</Text>
    </View>
  );
});
