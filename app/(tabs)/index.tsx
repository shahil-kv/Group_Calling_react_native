import { useAuth } from '@/contexts/AuthContext';
import { useContactStore } from '@/stores/contactStore';
import { useGroupStore } from '@/stores/groupStore';
import { router } from 'expo-router';
import 'nativewind';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function HomeScreen() {
  const { user } = useAuth();
  const { contacts } = useContactStore();
  const { groups } = useGroupStore();

  // Recent calls would come from a call history store in a real implementation
  const recentCalls = [
    {
      id: '1',
      name: 'Team Meeting',
      date: '2 days ago',
      status: 'Completed',
      contactsReached: 8,
      totalContacts: 10,
    },
    {
      id: '2',
      name: 'Family Event',
      date: 'Yesterday',
      status: 'Completed',
      contactsReached: 5,
      totalContacts: 5,
    },
  ];

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-5 pb-4 pt-14">
        <Text className="text-2xl font-bold text-dark">Welcome back</Text>
        <Text className="text-gray-500">shahil</Text>
      </View>

      {/* Account status */}
      <View className="p-5 mx-5 mb-6 bg-primary rounded-xl">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-white">Free Account</Text>
          {!user?.is_premium && (
            <TouchableOpacity
              className="px-3 py-1 bg-white rounded-full"
              onPress={() => router.push('/settings')}
            >
              <Text className="text-xs font-bold text-primary">Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="bg-white/20 h-[1] mb-3" />
        <View className="flex-row items-center">
          <Icon name="users" size={18} color="#FFFFFF" />
          <Text className="ml-2 text-white">{contacts.length} of 200 contacts</Text>
        </View>
      </View>

      {/* Quick actions */}
      <View className="mx-5 mb-6">
        <Text className="mb-3 text-lg font-bold text-dark">Quick Actions</Text>
        <View className="flex-row gap-4 space-x-4">
          <TouchableOpacity
            className="items-center flex-1 p-4 bg-white shadow-sm rounded-xl"
            // onPress={() => router.push('/groups')}
          >
            <View className="items-center justify-center w-12 h-12 mb-2 rounded-full bg-accent/10">
              <Icon name="users" size={24} color="#10B981" />
            </View>
            <Text className="font-medium text-dark">New Group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center flex-1 p-4 bg-white shadow-sm rounded-xl"
            // onPress={() => router.push('/calling')}
          >
            <View className="items-center justify-center w-12 h-12 mb-2 rounded-full bg-error/10">
              <Icon name="phone" size={24} color="#EF4444" />
            </View>
            <Text className="font-medium text-dark">Start Call</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent groups */}
      <View className="mx-5 mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-dark">Your Groups</Text>
          <TouchableOpacity>
            <Text className="text-secondary">See All</Text>
          </TouchableOpacity>
        </View>

        {groups.length > 0 ? (
          groups.slice(0, 3).map((group: any) => (
            <TouchableOpacity
              key={group.id}
              className="flex-row items-center justify-between p-4 mb-3 bg-white shadow-sm rounded-xl"
              //   onPress={() => router.push(`/groups/${group.id}`)}
            >
              <View className="flex-row items-center">
                <View className="items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Icon name="users" size={20} color="#1E3A8A" />
                </View>
                <View className="ml-3">
                  <Text className="font-medium text-dark">{group.name}</Text>
                  <Text className="text-sm text-gray-500">{group.contacts.length} contacts</Text>
                </View>
              </View>
              <Icon name="arrow-right" size={18} color="#64748b" />
            </TouchableOpacity>
          ))
        ) : (
          <View className="items-center justify-center p-6 bg-white shadow-sm rounded-xl">
            <Text className="text-center text-gray-500">
              You dont have any groups yet. Create your first group to get started.
            </Text>
            <TouchableOpacity
              className="px-4 py-2 mt-4 rounded-lg bg-secondary"
              // onPress={() => router.push('/groups')}
            >
              <Text className="font-medium text-white">Create Group</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recent calls */}
      <View className="mx-5 mb-8">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-dark">Recent Calls</Text>
        </View>

        {recentCalls.length > 0 ? (
          recentCalls.map(call => (
            <View key={call.id} className="p-4 mb-3 bg-white shadow-sm rounded-xl">
              <View className="flex-row items-center justify-between">
                <Text className="font-medium text-dark">{call.name}</Text>
                <Text className="text-xs text-gray-500">{call.date}</Text>
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-sm text-gray-500">
                  {call.contactsReached}/{call.totalContacts} contacts reached
                </Text>
                <View className="px-2 py-1 rounded-full bg-success">
                  <Text className="text-xs font-medium text-white">{call.status}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View className="items-center justify-center p-6 bg-white shadow-sm rounded-xl">
            <Text className="text-center text-gray-500">
              You havent made any calls yet. Start a call to reach your contacts.
            </Text>
            <TouchableOpacity
              className="px-4 py-2 mt-4 rounded-lg bg-secondary"
              //   onPress={() => router.push('/calling')}
            >
              <Text className="font-medium text-white">Start Call</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
