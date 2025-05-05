import 'nativewind';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBell?: boolean;
}

const Header = ({ title, subtitle, showBell = false }: HeaderProps) => {
  return (
    <View className="flex-row items-center justify-between px-5 pb-4 pt-14">
      <View>
        <Text className="text-2xl font-bold text-dark">{title}</Text>
        {subtitle && <Text className="text-gray-500">{subtitle}</Text>}
      </View>

      {showBell && (
        <TouchableOpacity className="items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm">
          <Icon name="bell" size={20} color="#64748b" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Header;
