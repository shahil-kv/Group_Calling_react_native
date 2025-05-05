import * as Contacts from 'expo-contacts';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (groupData: { name: string; description: string; contacts: any[] }) => void;
  isEditing?: boolean;
  initialData?: {
    name: string;
    description: string;
    contacts: any[];
  };
}

export default function CreateGroupModal({
  visible,
  onClose,
  onSave,
  isEditing = false,
  initialData,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedContacts, setSelectedContacts] = useState<any[]>(initialData?.contacts || []);
  const [deviceContacts, setDeviceContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactSelector, setShowContactSelector] = useState(false);

  useEffect(() => {
    if (visible) {
      loadDeviceContacts();
    }
  }, [visible]);

  const loadDeviceContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
        });
        setDeviceContacts(data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
    }
  };

  const filteredContacts = deviceContacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleContactSelection = (contact: any) => {
    setSelectedContacts(prev =>
      prev.some(c => c.id === contact.id)
        ? prev.filter(c => c.id !== contact.id)
        : [...prev, contact]
    );
  };

  const handleSave = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }
    onSave({
      name: groupName,
      description,
      contacts: selectedContacts,
    });
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-black/50">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <View className="bg-white rounded-t-[32px] shadow-2xl">
            {showContactSelector ? (
              <View className="h-[90vh]">
                <View className="p-6 border-b border-gray-100">
                  <View className="flex-row items-center justify-between mb-6">
                    <View>
                      <Text className="text-2xl font-bold text-gray-900">Select Contacts</Text>
                      <Text className="text-gray-500 mt-1">Choose contacts for your group</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowContactSelector(false)}
                      className="w-10 h-10 items-center justify-center rounded-full bg-gray-50"
                    >
                      <Icon name="close" size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row items-center mb-4">
                    <View className="flex-row items-center flex-1 px-4 py-3 bg-gray-50 rounded-xl">
                      <Icon name="search" size={18} color="#64748b" />
                      <TextInput
                        className="flex-1 px-3 text-base"
                        placeholder="Search contacts..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-gray-500">
                      {selectedContacts.length} contacts selected
                    </Text>
                    {selectedContacts.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSelectedContacts([])}
                        className="px-3 py-1 rounded-full bg-gray-100"
                      >
                        <Text className="text-sm font-medium text-gray-600">Clear all</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <ScrollView className="flex-1">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map(contact => (
                      <TouchableOpacity
                        key={contact.id}
                        className={`py-4 px-6 flex-row items-center justify-between ${
                          selectedContacts.some(c => c.id === contact.id) ? 'bg-primary/5' : ''
                        }`}
                        onPress={() => toggleContactSelection(contact)}
                      >
                        <View className="flex-row items-center flex-1">
                          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                            <Text className="text-gray-600 font-medium">
                              {contact.name?.[0]?.toUpperCase() || '?'}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="font-medium text-gray-900">{contact.name}</Text>
                            {contact.phoneNumbers?.[0] && (
                              <Text className="text-sm text-gray-500 mt-0.5">
                                {contact.phoneNumbers[0].number}
                              </Text>
                            )}
                          </View>
                        </View>
                        {selectedContacts.some(c => c.id === contact.id) && (
                          <View className="items-center justify-center w-6 h-6 rounded-full bg-primary">
                            <Icon name="check" size={14} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View className="py-12 items-center">
                      <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                        <Icon name="search" size={24} color="#94a3b8" />
                      </View>
                      <Text className="text-gray-500 text-center">No contacts found</Text>
                    </View>
                  )}
                </ScrollView>

                <View className="p-6 border-t border-gray-100">
                  <TouchableOpacity
                    className="items-center py-4 rounded-xl bg-primary"
                    onPress={() => setShowContactSelector(false)}
                  >
                    <Text className="text-base font-semibold text-white">
                      Done • {selectedContacts.length} selected
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <View>
                    <Text className="text-2xl font-bold text-gray-900">
                      {isEditing ? 'Edit Group' : 'Create New Group'}
                    </Text>
                    <Text className="text-gray-500 mt-1">
                      {isEditing ? 'Update your group details' : 'Create a new group with contacts'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-50"
                  >
                    <Icon name="close" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View className="mb-6 space-y-5">
                  <View>
                    <Text className="mb-2 font-medium text-gray-700">Group Name</Text>
                    <TextInput
                      className="px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base"
                      placeholder="Enter group name"
                      placeholderTextColor="#94a3b8"
                      value={groupName}
                      onChangeText={setGroupName}
                    />
                  </View>

                  <View>
                    <Text className="mb-2 font-medium text-gray-700">Description (Optional)</Text>
                    <TextInput
                      className="px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base"
                      placeholder="Enter description"
                      placeholderTextColor="#94a3b8"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                      style={{ height: 100, textAlignVertical: 'top' }}
                    />
                  </View>

                  <View>
                    <Text className="mb-2 font-medium text-gray-700">Add Contacts</Text>
                    <TouchableOpacity
                      className="flex-row items-center justify-between px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl"
                      onPress={() => setShowContactSelector(true)}
                    >
                      <Text
                        className={selectedContacts.length > 0 ? 'text-gray-900' : 'text-gray-400'}
                      >
                        {selectedContacts.length > 0
                          ? `${selectedContacts.length} contacts selected`
                          : 'Select contacts'}
                      </Text>
                      <View className="flex-row items-center">
                        {selectedContacts.length > 0 && (
                          <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-2">
                            <Text className="text-white text-sm font-medium">
                              {selectedContacts.length}
                            </Text>
                          </View>
                        )}
                        <Icon name="chevron-right" size={16} color="#64748b" />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  className="items-center py-4 rounded-xl bg-primary"
                  onPress={handleSave}
                >
                  <Text className="text-base font-semibold text-white">
                    {isEditing ? 'Update Group' : 'Create Group'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
