import { router } from 'expo-router';
import 'nativewind';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import { useAuth } from '@/contexts/AuthContext';
import { useUserStore } from '@/stores/userStore';
import CallHistoryItem from '../../components/CallHistoryItem';
import Header from '../../components/Header';
import QuickAction from '../../components/QuickAction';
import StatusCard from '../../components/StatusCard';

interface Group {
  id: string;
  name: string;
  contacts: { id: string }[];
}

export default function HomeScreen() {
  // Mock data for demo purposes
  const contacts = [];
  const groups: Group[] = [];
  // Get user data from Auth Context
  const { user: authUser } = useAuth();

  // Get user data from Zustand store (if you're using it)
  const storeUser = useUserStore(state => state.user);

  // Determine which user object to use (prioritize the one with name data)
  const user = authUser || storeUser;

  // Recent calls would come from a call history store in a real implementation
  const recentCalls = [
    {
      id: '1',
      name: 'Team Meeting',
      date: '2 days ago',
      status: 'completed',
      contactsReached: '8/10 contacts reached',
    },
    {
      id: '2',
      name: 'Family Event',
      date: 'Yesterday',
      status: 'completed',
      contactsReached: '5/5 contacts reached',
    },
  ];

  const handleUpgrade = () => {
    // Handle upgrade logic - would typically navigate to a subscription page
  };

  return (
    <View className="flex-1 bg-background-primary">
      <ScrollView>
        <Header title="Welcome back" subtitle={user?.email} showBell={true} />

        {/* Account status */}
        <StatusCard
          title="Free Account"
          actionLabel="Upgrade"
          onAction={handleUpgrade}
          status={
            <View className="flex-row items-center">
              <Icon name="users" size={18} color="#FFFFFF" />
              <Text className="ml-2 text-white">{contacts.length} of 200 contacts</Text>
            </View>
          }
          className="mb-6"
        />

        {/* Quick actions */}
        <View className="mx-5 mb-6">
          <Text className="mb-3 text-lg font-bold text-text-primary">Quick Actions</Text>
          <View className="flex-row gap-4">
            <QuickAction
              iconName="users"
              iconColor="#10B981"
              backgroundColor="bg-accent/10"
              label="New Group"
              onPress={() => router.push('/groups')}
            />

            <QuickAction
              iconName="phone"
              iconColor="#3B82F6"
              backgroundColor="bg-error/10"
              label="Start Call"
              onPress={() => router.push('/calling')}
            />
          </View>
        </View>

        {/* Recent groups */}
        <View className="mx-5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-text-primary">Your Groups</Text>
            <TouchableOpacity onPress={() => router.push('/groups')}>
              <Text className="text-secondary">See All</Text>
            </TouchableOpacity>
          </View>

          {groups.length > 0 ? (
            groups.slice(0, 3).map((group: any) => (
              <TouchableOpacity
                key={group.id}
                className="flex-row items-center justify-between p-4 mb-3 shadow-sm bg-background-secondary rounded-xl"
              // onPress={() => router.push(`/groups/${group.id}`)}
              >
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Icon name="users" size={20} color="#1E3A8A" />
                  </View>
                  <View className="ml-3">
                    <Text className="font-medium text-dark">{group.name}</Text>
                    <Text className="text-sm text-text-secondary">"{group.contacts.length} contacts</Text>
                  </View>
                </View>
                <Icon name="arrow-right" size={18} color="#64748b" />
              </TouchableOpacity>
            ))
          ) : (
            <View className="items-center justify-center p-6 shadow-sm bg-background-secondary rounded-xl">
              <Text className="text-center text-text-secondary">
                You don't have any groups yet. Create your first group to get started.
              </Text>
              <TouchableOpacity
                className="px-4 py-2 mt-4 rounded-lg bg-secondary"
                onPress={() => router.push('/groups')}
              >
                <Text className="font-medium text-white">Create Group</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent calls */}
        <View className="mx-5 mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-text-primary">Recent Calls</Text>
          </View>

          {recentCalls.length > 0 ? (
            recentCalls.map(call => (
              <CallHistoryItem
                key={call.id}
                title={call.name}
                timeAgo={call.date}
                contactsReached={call.contactsReached}
                status={call.status as 'completed' | 'failed' | 'in-progress'}
              />
            ))
          ) : (
            <View className="items-center justify-center p-6 shadow-sm bg-background-secondary rounded-xl">
              <Text className="text-center text-text-secondary">
                You haven't made any calls yet. Start a call to reach your contacts.
              </Text>
              <TouchableOpacity
                className="px-4 py-2 mt-4 rounded-lg bg-secondary"
                onPress={() => router.push('/calling')}
              >
                <Text className="font-medium text-white">Start Call</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
