import CreateGroupModal from '@/components/CreateGroupModal';
import { useAuth } from '@/contexts/AuthContext';
import { useGet, usePost } from '@/hooks/useApi';
import { Contact, Group } from '@/types/contact.types';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, TouchableOpacity, View } from 'react-native';
import { FlatList, Text, TextInput } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useGroupStore } from '../../stores/groupStore';

// Types
interface GroupItemProps {
  group: Group;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

// Components
const SearchBar: React.FC<SearchBarProps> = memo(({ value, onChangeText }) => (
  <View className="flex-row items-center flex-1 p-3 bg-white border border-gray-200 rounded-lg">
    <Icon name="search" size={18} color="#64748b" />
    <TextInput
      className="flex-1 px-2"
      placeholder="Search groups..."
      value={value}
      onChangeText={onChangeText}
      accessibilityLabel="Search groups"
    />
    {value ? (
      <TouchableOpacity onPress={() => onChangeText('')} accessibilityLabel="Clear search">
        <Icon name="close" size={22} color="#64748b" />
      </TouchableOpacity>
    ) : null}
  </View>
));

const GroupItem: React.FC<GroupItemProps> = memo(({ group, onEdit, onDelete }) => (
  <TouchableOpacity
    key={`group-item-${group.id}`}
    className="p-4 mb-3 bg-white rounded-lg shadow-sm"
    accessibilityLabel={`View group ${group.name}`}
  >
    <View className="flex-row justify-between">
      <View className="flex-row items-center">
        <View className="items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <Icon name="user" size={20} color="#1E3A8A" />
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-medium text-dark">{group.name}</Text>
          <Text className="text-gray-500">{group.contacts.length} contacts</Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <TouchableOpacity
          className="p-2 mr-2"
          onPress={e => {
            e.stopPropagation();
            onEdit(group.id);
          }}
          accessibilityLabel={`Edit group ${group.name}`}
        >
          <Icon name="users" size={18} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity
          className="p-2 mr-2"
          onPress={e => {
            e.stopPropagation();
            onDelete(group.id);
          }}
          accessibilityLabel={`Delete group ${group.name}`}
        >
          <Icon name="trash" size={18} color="#ef4444" />
        </TouchableOpacity>
        <Icon name="arrow-right" size={18} color="#64748b" />
      </View>
    </View>
    {group.description ? (
      <Text className="mt-2 text-gray-500 pl-13">{group.description}</Text>
    ) : null}
  </TouchableOpacity>
));

const EmptyState: React.FC<{ searchQuery: string; onCreateGroup: () => void }> = memo(
  ({ searchQuery, onCreateGroup }) => (
    <View className="items-center justify-center flex-1 px-5">
      <Text className="mb-4 text-center text-gray-500">
        {searchQuery
          ? 'No groups match your search'
          : 'You have no groups yet. Create your first group to get started.'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          className="px-4 py-2 rounded-lg bg-primary"
          onPress={onCreateGroup}
          accessibilityLabel="Create your first group"
        >
          <Text className="font-medium text-white">Create Group</Text>
        </TouchableOpacity>
      )}
    </View>
  )
);

const OfflineBanner: React.FC = memo(() => (
  <View className="p-2 mb-4 bg-yellow-100 rounded-lg">
    <Text className="text-center text-yellow-800">
      You're offline. Changes will be synced when you're back online.
    </Text>
  </View>
));

export default function GroupsScreen() {
  const {
    groups,
    addGroup,
    updateGroup,
    deleteGroup,
    setGroups,
    isOffline,
    setOfflineMode,
    offlineChanges,
    clearOfflineChanges,
  } = useGroupStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();

  const { mutateAsync: CrudGroup } = usePost('/group/manage-group', {
    invalidateQueriesOnSuccess: ['group'],
    showErrorToast: true,
    showSuccessToast: true,
    showLoader: true,
  });

  const { mutateAsync: GetGroups } = useGet('/group/get-groups', {
    invalidateQueriesOnSuccess: ['group'],
    showErrorToast: true,
    showSuccessToast: false,
    showLoader: true,
  });

  const fetchGroups = useCallback(async () => {
    if (!user?.id || isOffline) return;
    try {
      const response = await GetGroups({ userId: user.id });
      if (response?.data) {
        const transformedGroups = response.data.map(
          (group: {
            id: number;
            group_name: string;
            description: string;
            contacts: Array<{
              id: number;
              contact_id: string | null;
              name: string;
              phone_number: string;
            }>;
          }) => ({
            id: group.id.toString(),
            name: group.group_name,
            description: group.description,
            contacts: group.contacts.map(
              (contact: {
                id: number;
                contact_id: string | null;
                name: string;
                phone_number: string;
              }) => ({
                id: contact.contact_id || contact.id.toString(),
                name: contact.name,
                firstName: contact.name.split(' ')[0],
                lastName: contact.name.split(' ').slice(1).join(' '),
                contactType: 'person',
                imageAvailable: false,
                phoneNumbers: [
                  {
                    id: contact.id.toString(),
                    label: 'mobile',
                    number: contact.phone_number,
                    digits: contact.phone_number.replace(/\D/g, ''),
                    countryCode: contact.phone_number.startsWith('+')
                      ? contact.phone_number.split(' ')[0]
                      : '',
                  },
                ],
                addresses: [],
              })
            ),
            createdAt: new Date().toISOString(),
          })
        );
        setGroups(transformedGroups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      if (!isOffline) {
        Alert.alert('Error', 'Failed to fetch groups. Please try again.');
      }
    }
  }, [user?.id, GetGroups, CrudGroup, isOffline]);

  // Monitor network status and sync changes when back online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state: NetInfoState) => {
      const wasOffline = !state.isConnected;
      setOfflineMode(!state.isConnected);

      // If we're back online and have offline changes, sync them
      if (wasOffline && state.isConnected && offlineChanges.length > 0) {
        try {
          // First fetch latest data
          await fetchGroups();

          // Then apply offline changes
          for (const change of offlineChanges) {
            switch (change.type) {
              case 'ADD':
                await CrudGroup({
                  userId: user?.id,
                  groupId: 0,
                  groupName: change.data.name,
                  description: change.data.description,
                  contacts: change.data.contacts.map((contact: Contact) => ({
                    name: contact.name,
                    contactId: contact.id,
                    phoneNumber: contact.phoneNumbers[0]?.number || '',
                  })),
                  opsMode: 'INSERT',
                });
                break;
              case 'UPDATE':
                await CrudGroup({
                  userId: user?.id,
                  groupId: change.data.id,
                  groupName: change.data.updates.name,
                  description: change.data.updates.description,
                  contacts:
                    change.data.updates.contacts?.map((contact: Contact) => ({
                      name: contact.name,
                      contactId: contact.id,
                      phoneNumber: contact.phoneNumbers[0]?.number || '',
                    })) || [],
                  opsMode: 'UPDATE',
                });
                break;
              case 'DELETE':
                await CrudGroup({
                  userId: user?.id,
                  groupId: change.data.id,
                  opsMode: 'DELETE',
                });
                break;
            }
          }

          // Clear offline changes after successful sync
          clearOfflineChanges();

          // Fetch latest data again to ensure everything is in sync
          await fetchGroups();
        } catch (error) {
          console.error('Error syncing offline changes:', error);
          Alert.alert('Sync Error', 'Failed to sync offline changes. Please try again.');
        }
      }
    });

    return () => unsubscribe();
  }, [setOfflineMode, offlineChanges, clearOfflineChanges, user?.id, CrudGroup, fetchGroups]);

  const handleRefresh = useCallback(async () => {
    if (isOffline) {
      Alert.alert('Offline', 'Cannot refresh while offline');
      return;
    }
    setIsRefreshing(true);
    await fetchGroups();
    setIsRefreshing(false);
  }, [fetchGroups, isOffline]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleAddGroup = useCallback(
    async (groupData: { name: string; description: string; contacts: Contact[] }) => {
      try {
        if (!user) return;
        const payload = {
          userId: user.id,
          groupId: isEditing && currentGroupId ? currentGroupId : 0,
          groupName: groupData.name,
          description: groupData.description,
          contacts: groupData.contacts.map((contact: Contact) => ({
            name: contact.name,
            contactId: contact.id,
            phoneNumber: contact.phoneNumbers[0]?.number || '',
          })),
          opsMode: isEditing && currentGroupId ? 'UPDATE' : 'INSERT',
        };

        if (!isOffline) {
          await CrudGroup(payload);
        }

        if (isEditing && currentGroupId) {
          updateGroup(currentGroupId, groupData);
        } else {
          addGroup(groupData.name, groupData.description, groupData.contacts);
        }
        setModalVisible(false);
        clearForm();
      } catch (e) {
        console.error('axios error', e);
        if (!isOffline) {
          Alert.alert('Error', 'Failed to save group. Please try again.');
        }
      }
    },
    [isEditing, currentGroupId, updateGroup, addGroup, user, isOffline]
  );

  const handleEditGroup = useCallback(
    (groupId: string) => {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;
      setCurrentGroupId(groupId);
      setIsEditing(true);
      setModalVisible(true);
    },
    [groups]
  );

  const deleteGroupFromId = async (id: string) => {
    try {
      if (!isOffline) {
        await CrudGroup({ groupId: id, opsMode: 'DELETE', userId: user?.id });
      }
      deleteGroup(id);
    } catch (error) {
      console.error('Error deleting group:', error);
      if (!isOffline) {
        Alert.alert('Error', 'Failed to delete group. Please try again.');
      }
    }
  };

  const handleDeleteGroup = useCallback(
    (id: string) => {
      Alert.alert('Delete Group', 'Are you sure you want to delete this group?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGroupFromId(id) },
      ]);
    },
    [deleteGroupFromId]
  );

  const clearForm = useCallback(() => {
    setCurrentGroupId(null);
    setIsEditing(false);
    setModalVisible(false);
  }, []);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter(
      group =>
        group.name.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query) ||
        group.contacts.some(contact => contact.name.toLowerCase().includes(query))
    );
  }, [groups, searchQuery]);

  const handleCreateGroup = useCallback(() => {
    clearForm();
    setTimeout(() => setModalVisible(true), 0);
  }, [clearForm]);

  return (
    <SafeAreaView className="flex-1 px-4 bg-background">
      <View>
        <Text className="text-2xl font-bold text-dark">Groups</Text>
        <Text className="text-gray-500">Manage your contact groups</Text>
      </View>
      {isOffline && <OfflineBanner />}
      <View className="flex-row items-center my-4">
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>
      <View className="mb-4">
        <TouchableOpacity
          onPress={handleCreateGroup}
          className="flex-row items-center justify-center gap-3 py-4 rounded-lg bg-primary"
          accessibilityLabel="Create new group"
        >
          <Icon name="user" size={18} color="#FFFFFF" />
          <Text className="font-medium text-white">Create New Group</Text>
        </TouchableOpacity>
      </View>
      {filteredGroups.length > 0 ? (
        <FlatList
          data={filteredGroups}
          keyExtractor={item => `group-${item.id}`}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <GroupItem group={item} onEdit={handleEditGroup} onDelete={handleDeleteGroup} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              enabled={!isOffline}
            />
          }
        />
      ) : (
        <EmptyState searchQuery={searchQuery} onCreateGroup={handleCreateGroup} />
      )}
      <CreateGroupModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          clearForm();
        }}
        onSave={handleAddGroup}
        isEditing={isEditing}
        initialData={
          isEditing && currentGroupId
            ? {
                name: groups.find(g => g.id === currentGroupId)?.name || '',
                description: groups.find(g => g.id === currentGroupId)?.description || '',
                contacts: groups.find(g => g.id === currentGroupId)?.contacts || [],
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}
