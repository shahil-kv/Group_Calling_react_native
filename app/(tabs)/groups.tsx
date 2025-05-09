import CreateGroupModal from '@/components/CreateGroupModal';
import React, { useCallback, useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { FlatList, Text, TextInput } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useGroupStore } from '../../stores/groupStore';

export default function GroupsScreen() {
  const { groups, addGroup, updateGroup, deleteGroup } = useGroupStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  const filteredGroups = groups.filter((group: any) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddGroup = useCallback(
    (groupData: { name: string; description: string; contacts: any[] }) => {
      if (isEditing && currentGroupId) {
        updateGroup(currentGroupId, groupData);
      } else {
        addGroup(groupData.name, groupData.description, groupData.contacts);
      }
      setModalVisible(false);
      clearForm();
    },
    [isEditing, currentGroupId, updateGroup, addGroup]
  );

  const handleEditGroup = useCallback(
    (groupId: string) => {
      const group = groups.find((g: any) => g.id === groupId);
      if (!group) return;
      setCurrentGroupId(groupId);
      setIsEditing(true);
      setModalVisible(true);
    },
    [groups]
  );

  const handleDeleteGroup = useCallback(
    (id: string) => {
      Alert.alert('Delete Group', 'Are you sure you want to delete this group?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGroup(id) },
      ]);
    },
    [deleteGroup]
  );

  const clearForm = useCallback(() => {
    setCurrentGroupId(null);
    setIsEditing(false);
    setModalVisible(false);
  }, []);

  const GroupList = () => (
    <FlatList
      data={filteredGroups}
      keyExtractor={item => `group-${item.id}`}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          key={`group-item-${item.id}`}
          className="p-4 mb-3 bg-white rounded-lg shadow-sm"
          accessibilityLabel={`View group ${item.name}`}
        >
          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <View className="items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Icon name="user" size={20} color="#1E3A8A" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-medium text-dark">{item.name}</Text>
                <Text className="text-gray-500">{item.contacts.length} contacts</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                className="p-2 mr-2"
                onPress={e => {
                  e.stopPropagation();
                  handleEditGroup(item.id);
                }}
                accessibilityLabel={`Edit group ${item.name}`}
              >
                <Icon name="users" size={18} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity
                className="p-2 mr-2"
                onPress={e => {
                  e.stopPropagation();
                  handleDeleteGroup(item.id);
                }}
                accessibilityLabel={`Delete group ${item.name}`}
              >
                <Icon name="trash" size={18} color="#ef4444" />
              </TouchableOpacity>
              <Icon name="arrow-right" size={18} color="#64748b" />
            </View>
          </View>
          {item.description ? (
            <Text className="mt-2 text-gray-500 pl-13">{item.description}</Text>
          ) : null}
        </TouchableOpacity>
      )}
    />
  );

  const EmptyState = () => (
    <View className="items-center justify-center flex-1 px-5">
      <Text className="mb-4 text-center text-gray-500">
        {searchQuery
          ? 'No groups match your search'
          : 'You have no groups yet. Create your first group to get started.'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          className="px-4 py-2 rounded-lg bg-primary"
          onPress={() => {
            clearForm();
            setModalVisible(true);
          }}
          accessibilityLabel="Create your first group"
        >
          <Text className="font-medium text-white">Create Group</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 px-4 bg-background">
      <View>
        <Text className="text-2xl font-bold text-dark">Groups</Text>
        <Text className="text-gray-500">Manage your contact groups</Text>
      </View>
      <View className="flex-row items-center my-4">
        <View className="flex-row items-center flex-1 p-3 bg-white border border-gray-200 rounded-lg">
          <Icon name="search" size={18} color="#64748b" />
          <TextInput
            className="flex-1 px-2"
            placeholder="Search groups..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search groups"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
              <Icon name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <View className="mb-4">
        <TouchableOpacity
          onPress={() => {
            clearForm();
            setTimeout(() => setModalVisible(true), 0);
          }}
          className="flex-row items-center justify-center gap-3 py-4 rounded-lg bg-primary"
          accessibilityLabel="Create new group"
        >
          <Icon name="user" size={18} color="#FFFFFF"></Icon>
          <Text className="font-medium text-white">Create New Group</Text>
        </TouchableOpacity>
      </View>
      {filteredGroups.length > 0 ? <GroupList /> : <EmptyState />}
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
