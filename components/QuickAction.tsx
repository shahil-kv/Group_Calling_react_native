import 'nativewind';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface QuickActionProps {
  iconName: string;
  iconColor: string;
  backgroundColor: string;
  label: string;
  onPress?: () => void;
}

const QuickAction = ({
  iconName,
  iconColor,
  backgroundColor,
  label,
  onPress,
}: QuickActionProps) => {
  return (
    <TouchableOpacity
      className="items-center flex-1 p-4 shadow-sm bg-background-secondary rounded-xl"
      onPress={onPress}
    >
      <View
        className={`items-center justify-center w-12 h-12 mb-2 rounded-full ${backgroundColor}`}
      >
        <Icon name={iconName} size={24} color={iconColor} />
      </View>
      <Text className="font-medium text-text-primary">{label}</Text>
    </TouchableOpacity>
  );
};

export default QuickAction;
