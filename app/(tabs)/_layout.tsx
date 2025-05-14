// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();

  // Define theme-specific colors
  const activeTintColor = theme === 'dark' ? '#818CF8' : '#1E3A8A'; // primary
  const inactiveTintColor = theme === 'dark' ? '#94A3B8' : '#64748B'; // neutral
  const tabBarBackground = theme === 'dark' ? '#1E1E1E' : '#F8FAFC'; // background
  const tabBarBorderTopColor = theme === 'dark' ? '#4B5563' : '#E2E8F0'; // borderTopColor

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
          backgroundColor: tabBarBackground,
          borderTopColor: tabBarBorderTopColor
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "InterMedium",
        },
        // lazy: true,
        tabBarShowLabel: true,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ color, size }) => (
            <Icon name="users" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calling"
        options={{
          title: "Call",
          tabBarIcon: ({ color, size }) => (
            <Icon name="phone" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Icon name="gear" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}