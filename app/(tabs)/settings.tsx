import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../../contexts/AuthContext';
import { useUserStore } from '../../stores/userStore';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user, upgradeToPro } = useUserStore();
  const [notifications, setNotifications] = useState(true);
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
          upgradeToPro('monthly')
            .then(() => {
              Alert.alert('Success', 'You have been upgraded to Pro!');
            })
            .catch((error: any) => {
              Alert.alert('Error', 'Failed to upgrade. Please try again.');
            });
        },
      },
      {
        text: 'Yearly (₹4,999/year)',
        onPress: () => {
          upgradeToPro('yearly')
            .then(() => {
              Alert.alert('Success', 'You have been upgraded to Pro!');
            })
            .catch((error: any) => {
              Alert.alert('Error', 'Failed to upgrade. Please try again.');
            });
        },
      },
    ]);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView className="flex-1">
        <View className="p-6">
          <View className="mb-8">
            <Text className="mb-2 text-2xl font-bold text-dark">Settings</Text>
            <Text className="text-gray-500">Manage your account and preferences</Text>
          </View>

          <View className="space-y-6">
            {/* Account Section */}
            <View>
              <Text className="mb-4 text-lg font-semibold text-dark">Account</Text>
              <View className="p-4 space-y-4 bg-white rounded-lg">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Email</Text>
                  <Text className="text-gray-500">{user?.email}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Subscription</Text>
                  <Text className={user?.isPro ? 'text-green-500' : 'text-gray-500'}>
                    {user?.isPro ? 'Pro' : 'Free'}
                  </Text>
                </View>
                {!user?.isPro && (
                  <TouchableOpacity
                    className="items-center py-3 rounded-lg bg-primary"
                    onPress={handleUpgrade}
                  >
                    <Text className="font-medium text-white">Upgrade to Pro</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Notifications Section */}
            <View>
              <Text className="mb-4 text-lg font-semibold text-dark">Notifications</Text>
              <View className="p-4 bg-white rounded-lg">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Push Notifications</Text>
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={notifications ? '#1E3A8A' : '#f4f3f4'}
                  />
                </View>
              </View>
            </View>

            {/* Legal Section */}
            <View>
              <Text className="mb-4 text-lg font-semibold text-dark">Legal</Text>
              <View className="p-4 space-y-4 bg-white rounded-lg">
                <TouchableOpacity
                  onPress={() => setShowPrivacyPolicy(true)}
                  className="flex-row items-center justify-between"
                >
                  <Text className="text-gray-700">Privacy Policy</Text>
                  <Icon name="chevron-right" size={16} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowTerms(true)}
                  className="flex-row items-center justify-between"
                >
                  <Text className="text-gray-700">Terms of Service</Text>
                  <Icon name="chevron-right" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              className="items-center py-4 bg-red-500 rounded-lg"
              onPress={handleLogout}
            >
              <Text className="font-medium text-white">Log Out</Text>
            </TouchableOpacity>
          </View>
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
