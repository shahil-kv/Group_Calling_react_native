import 'nativewind';
import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface SettingsItemProps {
  label: string;
  value?: string;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (checked: boolean) => void;
  showArrow?: boolean;
  onClick?: () => void;
}

const SettingsItem = ({
  label,
  value,
  hasToggle = false,
  toggleValue = false,
  onToggleChange,
  showArrow = true,
  onClick,
}: SettingsItemProps) => {
  const renderContent = () => (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
      <Text className="font-medium text-text-secondary">{label}</Text>
      <View className="flex-row items-center">
        {value && <Text className="mr-2 text-text-primary">{value}</Text>}
        {hasToggle && (
          <Switch
            value={toggleValue}
            onValueChange={onToggleChange}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={toggleValue ? '#1E3A8A' : '#f4f3f4'}
          />
        )}
        {showArrow && <Icon name="chevron-right" size={16} color="#a3a3a3" />}
      </View>
    </View>
  );

  if (onClick) {
    return <TouchableOpacity onPress={onClick}>{renderContent()}</TouchableOpacity>;
  }

  return renderContent();
};

export default SettingsItem;
