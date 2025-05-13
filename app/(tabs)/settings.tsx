import { router } from 'expo-router';
import 'nativewind';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import Header from '../../components/Header';
import SettingsItem from '../../components/SettingsItem';

export default function SettingsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleUpgrade = () => {
    Alert.alert('Upgrade to Pro', 'Choose your subscription plan:', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Monthly (₹499/month)',
        onPress: () => {
          Alert.alert('Success', 'You have been upgraded to Pro!');
        },
      },
      {
        text: 'Yearly (₹4,999/year)',
        onPress: () => {
          Alert.alert('Success', 'You have been upgraded to Pro!');
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          // Sign out logic would go here
          router.replace('/login');
        },
      },
    ]);
  };

  const handlePrivacyPolicy = () => {
    setShowPrivacyPolicy(true);
  };

  const handleTerms = () => {
    setShowTerms(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="default" backgroundColor="#ffffff" />
      <ScrollView className="flex-1">
        <View className="flex-1 px-4">
          <Header title="Settings" subtitle="Manage your account and preferences" />

          {/* Account Section */}
          <View className="p-5 mb-6 bg-white shadow-sm rounded-xl">
            <Text className="mb-4 text-lg font-semibold">Account</Text>

            <SettingsItem label="Email" value="user@example.com" showArrow={false} />

            <SettingsItem label="Subscription" value="Free" showArrow={false} />

            <TouchableOpacity
              className="items-center w-full py-3 mt-4 rounded-lg bg-primary"
              onPress={handleUpgrade}
            >
              <Text className="font-medium text-white">Upgrade to Pro</Text>
            </TouchableOpacity>
          </View>

          {/* Notifications Section */}
          <View className="p-5 mb-6 bg-white shadow-sm rounded-xl">
            <Text className="mb-4 text-lg font-semibold">Notifications</Text>

            <SettingsItem
              label="Push Notifications"
              hasToggle={true}
              toggleValue={pushNotifications}
              onToggleChange={setPushNotifications}
              showArrow={false}
            />
          </View>

          {/* Legal Section */}
          <View className="p-5 mb-6 bg-white shadow-sm rounded-xl">
            <Text className="mb-4 text-lg font-semibold">Legal</Text>

            <SettingsItem label="Privacy Policy" onClick={handlePrivacyPolicy} showArrow={true} />

            <SettingsItem label="Terms of Service" onClick={handleTerms} showArrow={true} />
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            className="items-center w-full py-4 mb-8 bg-red-500 rounded-lg"
            onPress={handleLogout}
          >
            <Text className="font-medium text-white">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyPolicy}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrivacyPolicy(false)}
      >
        <View className="justify-end flex-1 bg-black/50">
          <View className="p-6 bg-white rounded-t-3xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold">Privacy Policy</Text>
              <TouchableOpacity onPress={() => setShowPrivacyPolicy(false)}>
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text className="text-gray-700">
                Your privacy is important to us. This Privacy Policy explains how we collect, use,
                and protect your personal information...
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal
        visible={showTerms}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTerms(false)}
      >
        <View className="justify-end flex-1 bg-black/50">
          <View className="p-6 bg-white rounded-t-3xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold">Terms of Service</Text>
              <TouchableOpacity onPress={() => setShowTerms(false)}>
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text className="text-gray-700">
                By using our service, you agree to these terms. Please read them carefully...
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
