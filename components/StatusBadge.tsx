import { StatusStyle, getStatusStyle } from '@/utils/getStatusStyle';
import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

// Map Tailwind color classes to raw color values for Icon
const colorMap: { [key: string]: string } = {
  'text-success': '#4BB543', // Green for success (adjust based on your Tailwind config)
  'text-danger': '#EF4444', // Red for danger
  'text-gray-500': '#6B7280', // Gray for pending
};

interface StatusBadgeProps {
  status: string | undefined;
  style?: StatusStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status, style }) => {
  const { color, bgColor, icon } = style || getStatusStyle(status);
  const statusText = status || 'In Progress';

  // Get the raw color value for the Icon
  const iconColor = colorMap[color] || '#000000'; // Default to black if color not found

  return (
    <View
      className={`flex-row items-center px-2 py-1 rounded-full ${bgColor}`}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Status: ${statusText}`}
    >
      <Icon name={icon} size={16} color={iconColor} />
      <Text className={`text-sm font-medium uppercase ml-2 ${color}`}>{statusText}</Text>
    </View>
  );
});
