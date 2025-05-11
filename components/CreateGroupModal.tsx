import { Contact } from '@/types/contact.types';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import XLSX from 'xlsx';
import ContactSelector from './ContactSelector';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (groupData: { name: string; description: string; contacts: Contact[] }) => void;
  isEditing?: boolean;
  initialData?: {
    name: string;
    description: string;
    contacts: Contact[];
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
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>(initialData?.contacts || []);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Sync state with initialData when editing
  useEffect(() => {
    if (isEditing && initialData) {
      setGroupName(initialData.name || '');
      setDescription(initialData.description || '');
      setSelectedContacts(initialData.contacts || []);
    }
  }, [isEditing, initialData]);

  // Reset form when modal becomes visible and not in editing mode
  useEffect(() => {
    if (visible && !isEditing) {
      setGroupName('');
      setDescription('');
      setSelectedContacts([]);
    }
  }, [visible, isEditing]);

  const convertToContact = (row: any): Contact | null => {
    // Skip invalid rows
    if (!row || typeof row !== 'object') return null;

    // Get name and phone with fallbacks
    const name = row.name || row.Name || '';
    const phone = row.phone || row.Phone || row.phoneNumber || row.PhoneNumber || '';

    // Skip if no name or phone
    if (!name || !phone) return null;

    const [firstName = '', lastName = ''] = name.split(' ');

    // {"contacts": [{"contactType": "person", "firstName": "Adhil", "id": "EB5F4CFC-D759-4478-8A52-5EA0B7F527D3", "imageAvailable": false, "name": "Adhil", "phoneNumbers": [Array]}], "description": "xxf", "groupId": 0, "groupName": "ss", "opsMode": "INSERT", "userId": 33}

    // make the contact section like this above

    return {
      id: Math.random().toString(),
      name,
      firstName,
      lastName,
      contactType: 'person',
      imageAvailable: false,
      phoneNumbers: [
        {
          id: Math.random().toString(),
          label: 'mobile',
          number: phone,
          digits: phone.replace(/\D/g, ''),
          countryCode: phone.startsWith('+') ? phone.split(' ')[0] : '+91',
        },
      ],
      addresses: [],
    };
  };

  const handleFileImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setIsImporting(true);
      const file = result.assets[0];
      const fileUri = file.uri;
      const fileType = file.mimeType;

      let fileData;
      if (
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileType === 'application/vnd.ms-excel'
      ) {
        // Excel file
        fileData = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const workbook = XLSX.read(fileData, { type: 'base64' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Convert to contacts format with validation
        const contacts = jsonData
          .map(convertToContact)
          .filter((contact): contact is Contact => contact !== null);

        if (contacts.length === 0) {
          Alert.alert('Warning', 'No valid contacts found in the file');
          return;
        }

        setSelectedContacts(prev => [...prev, ...contacts]);
      } else if (fileType === 'text/csv') {
        // CSV file
        fileData = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const workbook = XLSX.read(fileData, { type: 'string' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Convert to contacts format with validation
        const contacts = jsonData
          .map(convertToContact)
          .filter((contact): contact is Contact => contact !== null);

        if (contacts.length === 0) {
          Alert.alert('Warning', 'No valid contacts found in the file');
          return;
        }

        setSelectedContacts(prev => [...prev, ...contacts]);
      }

      // Clean up the temporary file
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (err) {
      console.error('File import error:', err);
      Alert.alert('Error', 'Failed to import contacts from file. Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    // Pass the group data to the parent component
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
              onDone={(contacts: any[]) => setSelectedContacts(contacts)}
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
                  <View className="space-y-3">
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

                    <TouchableOpacity
                      className="flex-row items-center justify-between px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl"
                      onPress={handleFileImport}
                      disabled={isImporting}
                      accessibilityLabel="Import contacts from file"
                    >
                      <View className="flex-row items-center">
                        <Icon
                          name="file-excel-o"
                          size={20}
                          color="#64748b"
                          style={{ marginRight: 12 }}
                        />
                        <Text className="text-gray-900">
                          {isImporting ? 'Importing...' : 'Import from Excel/CSV'}
                        </Text>
                      </View>
                      {isImporting ? (
                        <ActivityIndicator size="small" color="#64748b" />
                      ) : (
                        <Icon name="upload" size={16} color="#64748b" />
                      )}
                    </TouchableOpacity>
                  </View>
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
