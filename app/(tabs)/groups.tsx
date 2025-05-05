import React, { useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import CreateGroupModal from '../../components/CreateGroupModal';
import { useContactStore } from '../../stores/contactStore';
import { useGroupStore } from '../../stores/groupStore';

export default function GroupsScreen() {
  const { groups, addGroup, updateGroup, deleteGroup } = useGroupStore();
  const { contacts } = useContactStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  const filteredGroups = groups.filter((group: any) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddGroup = (groupData: { name: string; description: string; contacts: any[] }) => {
    if (isEditing && currentGroupId) {
      updateGroup(currentGroupId, groupData);
    } else {
      addGroup(groupData.name, groupData.description, groupData.contacts);
    }
    setModalVisible(false);
    clearForm();
  };

  const handleEditGroup = (groupId: string) => {
    const group = groups.find((g: any) => g.id === groupId);
    if (!group) return;

    setCurrentGroupId(groupId);
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleDeleteGroup = (id: string) => {
    Alert.alert('Delete Group', 'Are you sure you want to delete this group?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGroup(id) },
    ]);
  };

  const clearForm = () => {
    setCurrentGroupId(null);
    setIsEditing(false);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pb-4 pt-14">
        <Text className="text-2xl font-bold text-dark">Groups</Text>
        <Text className="text-gray-500">Manage your contact groups</Text>
      </View>

      <View className="flex-row items-center px-5 mb-4">
        <View className="flex-row items-center flex-1 px-3 bg-white border border-gray-200 rounded-lg">
          <Icon name="search" size={18} color="#64748b" />
          <TextInput
            className="flex-1 px-2 py-2"
            placeholder="Search groups..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View className="px-5 mb-4">
        <TouchableOpacity
          className="flex-row items-center justify-center py-3 rounded-lg bg-primary"
          onPress={() => {
            clearForm();
            setModalVisible(true);
          }}
        >
          <Icon name="user" size={18} color="#FFFFFF" />
          <Text className="ml-2 font-medium text-white">Create New Group</Text>
        </TouchableOpacity>
      </View>

      {filteredGroups.length > 0 ? (
        <FlatList
          data={filteredGroups}
          keyExtractor={item => `group-${item.id}`}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              key={`group-item-${item.id}`}
              className="p-4 mb-3 bg-white rounded-lg shadow-sm"
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
                  >
                    <Icon name="users" size={18} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="p-2 mr-2"
                    onPress={e => {
                      e.stopPropagation();
                      handleDeleteGroup(item.id);
                    }}
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
      ) : (
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
            >
              <Text className="font-medium text-white">Create Group</Text>
            </TouchableOpacity>
          )}
        </View>
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
    </View>
  );
}
