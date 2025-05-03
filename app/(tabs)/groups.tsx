import { useContactStore } from "@/stores/contactStore";
import { useGroupStore } from "@/stores/groupStore";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

export default function GroupsScreen() {
  const { groups, addGroup, updateGroup, deleteGroup } = useGroupStore();
  const { contacts } = useContactStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState("");

  const filteredGroups = groups.filter((group: any) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(
    (contact: any) =>
      contact.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(contactSearchQuery)
  );

  const handleAddGroup = () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Group name is required");
      return;
    }

    const selectedContacts = contacts.filter((contact: any) =>
      selectedContactIds.includes(contact.id)
    );

    if (isEditing && currentGroupId) {
      updateGroup(currentGroupId, {
        name: groupName,
        description,
        contacts: selectedContacts,
      });
    } else {
      addGroup(groupName, description, selectedContacts);
    }

    setModalVisible(false);
    clearForm();
  };

  const handleEditGroup = (groupId: string) => {
    const group = groups.find((g: any) => g.id === groupId);
    if (!group) return;

    setCurrentGroupId(groupId);
    setGroupName(group.name);
    setDescription(group.description || "");
    setSelectedContactIds(group.contacts.map((c: any) => c.id));
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleDeleteGroup = (id: string) => {
    Alert.alert("Delete Group", "Are you sure you want to delete this group?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteGroup(id) },
    ]);
  };

  const clearForm = () => {
    setGroupName("");
    setDescription("");
    setSelectedContactIds([]);
    setCurrentGroupId(null);
    setIsEditing(false);
    setShowContactSelector(false);
    setContactSearchQuery("");
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
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
            <TouchableOpacity onPress={() => setSearchQuery("")}>
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="p-4 mb-3 bg-white rounded-lg shadow-sm"
              // onPress={() => router.push(`/groups/${item.id}`)}
            >
              <View className="flex-row justify-between">
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Icon name="user" size={20} color="#1E3A8A" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-medium text-dark">{item.name}</Text>
                    <Text className="text-gray-500">
                      {item.contacts.length} contacts
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    className="p-2 mr-2"
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditGroup(item.id);
                    }}
                  >
                    <Icon name="users" size={18} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="p-2 mr-2"
                    onPress={(e) => {
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
                <Text className="mt-2 text-gray-500 pl-13">
                  {item.description}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      ) : (
        <View className="items-center justify-center flex-1 px-5">
          <Text className="mb-4 text-center text-gray-500">
            {searchQuery
              ? "No groups match your search"
              : "You have no groups yet. Create your first group to get started."}
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

      {/* Add/Edit Group Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          clearForm();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="justify-end flex-1"
        >
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            {showContactSelector ? (
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-bold">Select Contacts</Text>
                  <TouchableOpacity
                    onPress={() => setShowContactSelector(false)}
                  >
                    <Icon name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center mb-4">
                  <View className="flex-row items-center flex-1 px-3 bg-white border border-gray-200 rounded-lg">
                    <Icon name="search" size={18} color="#64748b" />
                    <TextInput
                      className="flex-1 px-2 py-2"
                      placeholder="Search contacts..."
                      value={contactSearchQuery}
                      onChangeText={setContactSearchQuery}
                    />
                    {contactSearchQuery ? (
                      <TouchableOpacity
                        onPress={() => setContactSearchQuery("")}
                      >
                        <Icon name="close" size={18} color="#64748b" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <Text className="mb-2 text-gray-500">
                  {selectedContactIds.length} contacts selected
                </Text>

                <ScrollView style={{ maxHeight: 400 }}>
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map((contact: any) => (
                      <TouchableOpacity
                        key={contact.id}
                        className={`border-b border-gray-100 py-3 px-2 flex-row items-center justify-between ${
                          selectedContactIds.includes(contact.id)
                            ? "bg-primary/5"
                            : ""
                        }`}
                        onPress={() => toggleContactSelection(contact.id)}
                      >
                        <View>
                          <Text className="font-medium">{contact.name}</Text>
                          <Text className="text-sm text-gray-500">
                            {contact.phoneNumber}
                          </Text>
                        </View>
                        {selectedContactIds.includes(contact.id) && (
                          <View className="items-center justify-center w-6 h-6 rounded-full bg-primary">
                            <Icon name="check" size={16} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text className="py-4 text-center text-gray-500">
                      No contacts found
                    </Text>
                  )}
                </ScrollView>

                <TouchableOpacity
                  className="items-center py-3 mt-4 rounded-lg bg-primary"
                  onPress={() => setShowContactSelector(false)}
                >
                  <Text className="font-bold text-white">Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-xl font-bold">
                    {isEditing ? "Edit Group" : "Create New Group"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      clearForm();
                    }}
                  >
                    <Icon name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View className="mb-6 space-y-4">
                  <View>
                    <Text className="mb-1 font-medium text-gray-700">
                      Group Name
                    </Text>
                    <TextInput
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg"
                      placeholder="Enter group name"
                      value={groupName}
                      onChangeText={setGroupName}
                    />
                  </View>

                  <View>
                    <Text className="mb-1 font-medium text-gray-700">
                      Description (Optional)
                    </Text>
                    <TextInput
                      className="px-4 py-3 bg-white border border-gray-300 rounded-lg"
                      placeholder="Enter description"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                      style={{ height: 80, textAlignVertical: "top" }}
                    />
                  </View>

                  <View>
                    <Text className="mb-1 font-medium text-gray-700">
                      Add Contacts
                    </Text>
                    <TouchableOpacity
                      className="flex-row items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg"
                      onPress={() => setShowContactSelector(true)}
                    >
                      <Text
                        className={
                          selectedContactIds.length > 0
                            ? "text-dark"
                            : "text-gray-400"
                        }
                      >
                        {selectedContactIds.length > 0
                          ? `${selectedContactIds.length} contacts selected`
                          : "Select contacts"}
                      </Text>
                      <Icon name="plus" size={18} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  className="items-center py-4 rounded-lg bg-primary"
                  onPress={handleAddGroup}
                >
                  <Text className="text-lg font-bold text-white">
                    {isEditing ? "Update Group" : "Create Group"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
