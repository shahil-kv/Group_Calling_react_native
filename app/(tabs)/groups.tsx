import { ExtendedContact } from '@/components/ContactSelector';
import CreateGroupModal from '@/components/CreateGroupModal';
import { useAuth } from '@/contexts/AuthContext';
import { useGet, usePost } from '@/hooks/useApi';
import { Group } from '@/types/contact.types';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
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

/**
 * Normalizes phone numbers to international format
 * @param phone Raw phone number
 * @returns Formatted international phone number or original if invalid
 */
const normalizePhoneNumber = (phone: string): string => {
  const phoneNumber = parsePhoneNumberFromString(phone, 'IN');
  return phoneNumber && phoneNumber.isValid() ? phoneNumber.formatInternational() : phone;
};

// Memoized Components for better performance
const SearchBar = memo(({ value, onChangeText }: SearchBarProps) => (
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

const GroupItem = memo(({ group, onEdit, onDelete }: GroupItemProps) => (
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

const EmptyState = memo(
  ({ searchQuery, onCreateGroup }: { searchQuery: string; onCreateGroup: () => void }) => (
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

/**
 * Main Groups Screen Component
 * Handles listing, creating, editing, and deleting contact groups
 */
export default function GroupsScreen() {
  // State management
  const { groups, addGroup, updateGroup, deleteGroup, setGroups } = useGroupStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();

  // API hooks
  const { mutateAsync: crudGroup } = usePost('/group/manage-group', {
    invalidateQueriesOnSuccess: ['group'],
    showErrorToast: true,
    showSuccessToast: true,
    showLoader: true,
  });

  const { mutateAsync: getGroups } = useGet('/group/get-groups', {
    invalidateQueriesOnSuccess: ['group'],
    showErrorToast: true,
    showSuccessToast: false,
    showLoader: true,
  });

  // Helper to clean contact ids by removing unnecessary prefixes
  const cleanContactId = (id: string) => id.replace(':ABPerson', '');

  /**
   * Fetches groups from API and transforms them to the required format
   */
  const fetchGroups = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await getGroups({
        userId: user.id,
      });

      if (response?.data) {
        // Transform API response format to app format
        const transformedGroups = response.data.map(
          (group: {
            id: number;
            group_name: string;
            description: string;
            contacts: Array<{
              id: number;
              contact_id: string | null;
              name: string;
              first_name: string | null;
              last_name: string | null;
              phone_number: string;
              country_code: string;
              raw_contact: any;
              is_contact_from_device: boolean;
            }>;
          }) => ({
            id: group.id.toString(),
            name: group.group_name,
            description: group.description,
            contacts: group.contacts.map(contact => {
              const rawContact = contact.raw_contact || {};
              const normalizedPhone = normalizePhoneNumber(contact.phone_number);

              return {
                id: cleanContactId(contact.contact_id || contact.id.toString()),
                name: contact.name,
                firstName: contact.first_name || contact.name.split(' ')[0],
                lastName: contact.last_name || contact.name.split(' ').slice(1).join(' '),
                contactType: 'person' as const,
                imageAvailable: rawContact.imageAvailable || false,
                phoneNumbers: [
                  {
                    id: contact.id.toString(),
                    label: 'mobile',
                    number: normalizedPhone,
                    digits: normalizedPhone.replace(/\D/g, ''),
                    countryCode: contact.country_code || normalizedPhone.split(' ')[0] || '',
                  },
                ],
                addresses: rawContact.addresses || [],
                isContactFromDevice: contact.is_contact_from_device,
              };
            }),
            createdAt: new Date().toISOString(),
          })
        );

        setGroups(transformedGroups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Error', 'Failed to fetch groups. Please try again.');
    }
  }, [user?.id, getGroups, setGroups]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchGroups();
    setIsRefreshing(false);
  }, [fetchGroups]);

  // Fetch groups on component mount or when user changes
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  /**
   * Handles adding or updating a group
   * @param groupData Group data including name, description and contacts
   */
  const handleAddGroup = useCallback(
    async (groupData: { name: string; description: string; contacts: ExtendedContact[] }) => {
      try {
        if (!user) return;

        // Prepare API payload
        const payload = {
          userId: user.id,
          groupId: isEditing && currentGroupId ? currentGroupId : 0,
          groupName: groupData.name,
          description: groupData.description,
          contacts: groupData.contacts.map(contact => ({
            ...contact,
            id: cleanContactId(
              contact.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`
            ),
            phoneNumbers: contact?.phoneNumbers?.map(phone => ({
              ...phone,
              number: normalizePhoneNumber(phone.number || ''),
              digits: phone.number?.replace(/\D/g, '') || '',
              countryCode: phone.number?.startsWith('+') ? phone.number.split(' ')[0] : '+91',
            })),
            isContactFromDevice: contact.isContactFromDevice ?? true,
          })),
          opsMode: isEditing && currentGroupId ? 'UPDATE' : 'INSERT',
        };

        // Call API
        await crudGroup(payload);

        // Update local state
        if (isEditing && currentGroupId) {
          updateGroup(currentGroupId, groupData);
        } else {
          addGroup(groupData.name, groupData.description, groupData.contacts);
        }

        setModalVisible(false);
        clearForm();
      } catch (e) {
        console.error('API error:', e);
        Alert.alert('Error', 'Failed to save group. Please try again.');
      }
    },
    [isEditing, currentGroupId, updateGroup, addGroup, user, crudGroup]
  );

  /**
   * Sets up editing mode for a group
   * @param groupId ID of group to edit
   */
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

  /**
   * Deletes a group by ID
   * @param id Group ID to delete
   */
  const deleteGroupById = async (id: string) => {
    try {
      await crudGroup({ groupId: id, opsMode: 'DELETE', userId: user?.id });
      deleteGroup(id);
    } catch (error) {
      console.error('Error deleting group:', error);
      Alert.alert('Error', 'Failed to delete group. Please try again.');
    }
  };

  /**
   * Handles delete confirmation for a group
   * @param id Group ID to delete
   */
  const handleDeleteGroup = useCallback(
    (id: string) => {
      Alert.alert('Delete Group', 'Are you sure you want to delete this group?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGroupById(id) },
      ]);
    },
    [deleteGroupById]
  );

  // Reset form state
  const clearForm = useCallback(() => {
    setCurrentGroupId(null);
    setIsEditing(false);
    setModalVisible(false);
  }, []);

  // Filter groups based on search query
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

  // Create new group handler
  const handleCreateGroup = useCallback(() => {
    clearForm();
    setTimeout(() => setModalVisible(true), 0);
  }, [clearForm]);

  return (
    <SafeAreaView className="flex-1 px-4 bg-background">
      {/* Header */}
      <View>
        <Text className="text-2xl font-bold text-dark">Groups</Text>
        <Text className="text-gray-500">Manage your contact groups</Text>
      </View>

      {/* Search bar */}
      <View className="flex-row items-center my-4">
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {/* Create group button */}
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

      {/* Groups list or empty state */}
      {filteredGroups.length > 0 ? (
        <FlatList
          data={filteredGroups}
          keyExtractor={item => `group-${item.id}`}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <GroupItem group={item} onEdit={handleEditGroup} onDelete={handleDeleteGroup} />
          )}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        />
      ) : (
        <EmptyState searchQuery={searchQuery} onCreateGroup={handleCreateGroup} />
      )}

      {/* Create/Edit Group Modal */}
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
