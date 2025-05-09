import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import ContactSelector from './ContactSelector';

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
  // State for group fields
  const [groupName, setGroupName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedContacts, setSelectedContacts] = useState<any[]>(initialData?.contacts || []);
  const [showContactSelector, setShowContactSelector] = useState(false);

  // Sync state with initialData when editing
  useEffect(() => {
    if (isEditing && initialData) {
      setGroupName(initialData.name || '');
      setDescription(initialData.description || '');
      setSelectedContacts(initialData.contacts || []);
    }
  }, [isEditing, initialData]);

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
        {showContactSelector && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              backgroundColor: 'rgba(0,0,0,0.3)',
              justifyContent: 'flex-end',
            }}
          >
            <ContactSelector
              visible={showContactSelector}
              onClose={() => setShowContactSelector(false)}
              onDone={setSelectedContacts}
              initialSelectedContacts={selectedContacts}
            />
          </View>
        )}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="justify-end flex-1"
        >
          <View className="bg-white rounded-t-[32px] shadow-2xl">
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <View>
                  <Text className="text-2xl font-bold text-gray-900">
                    {isEditing ? 'Edit Group' : 'Create New Group'}
                  </Text>
                  <Text className="mt-1 text-gray-500">
                    {isEditing ? 'Update your group details' : 'Create a new group with contacts'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  accessibilityLabel="Close group modal"
                  className="items-center justify-center w-10 h-10 rounded-full bg-gray-50"
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
                    accessibilityLabel="Select contacts for group"
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
                        <View className="items-center justify-center w-6 h-6 mr-2 rounded-full bg-primary">
                          <Text className="text-sm font-medium text-white">
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
                accessibilityLabel="Save group"
              >
                <Text className="text-base font-semibold text-white">
                  {isEditing ? 'Update Group' : 'Create Group'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
