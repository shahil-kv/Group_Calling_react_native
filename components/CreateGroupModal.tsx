import * as Contacts from 'expo-contacts';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
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
  onSave: (groupData: { name: string; description: string; contacts: Contacts.Contact[] }) => void;
  isEditing?: boolean;
  initialData?: {
    name: string;
    description: string;
    contacts: Contacts.Contact[];
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
  const [selectedContacts, setSelectedContacts] = useState<Contacts.Contact[]>(
    initialData?.contacts || []
  );
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (isEditing && initialData) {
      setGroupName(initialData.name || '');
      setDescription(initialData.description || '');
      setSelectedContacts(initialData.contacts || []);
    }
  }, [isEditing, initialData]);

  useEffect(() => {
    if (visible && !isEditing) {
      setGroupName('');
      setDescription('');
      setSelectedContacts([]);
    }
  }, [visible, isEditing]);

  const normalizePhoneNumber = (phone: string): string => {
    const phoneNumber = parsePhoneNumberFromString(phone, 'IN');
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatInternational();
    }
    return phone;
  };

  const getDigits = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  const convertToContact = (row: any, defaultCountry = 'IN'): Contacts.Contact | null => {
    if (!row || typeof row !== 'object') return null;

    const name = row.name || row.Name || '';
    const phone = row.phone || row.Phone || row.phoneNumber || row.PhoneNumber || '';

    if (!name || !phone) return null;

    const normalizedPhone = normalizePhoneNumber(phone);
    const digits = getDigits(normalizedPhone);
    const [firstName = '', ...lastNameParts] = name.trim().split(' ');
    const lastName = lastNameParts.join(' ');

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      contactType: 'person',
      name,
      firstName,
      lastName,
      phoneNumbers: [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          label: 'mobile',
          number: normalizedPhone,
          digits,
          countryCode: normalizedPhone.split(' ')[0] || '+91',
        },
      ],
      imageAvailable: false,
      addresses: [],
    };
  };

  const processExcelData = async (jsonData: any[], batchSize = 50): Promise<Contacts.Contact[]> => {
    const contacts: Contacts.Contact[] = [];
    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);
      const batchContacts = batch
        .map(row => convertToContact(row))
        .filter((contact): contact is Contacts.Contact => contact !== null);
      contacts.push(...batchContacts);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    return contacts;
  };

  const handleFileImport = async () => {
    try {
      setIsImporting(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ],
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const fileUri = file.uri;
      const fileType = file.mimeType as string;

      if (!fileType) {
        throw new Error('File type not found');
      }

      let jsonData;
      if (fileType.includes('excel') || fileType.includes('spreadsheetml')) {
        const fileData = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const workbook = XLSX.read(fileData, { type: 'base64' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(sheet);
      } else if (fileType === 'text/csv') {
        const fileData = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const workbook = XLSX.read(fileData, { type: 'string' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(sheet);
      } else {
        throw new Error('Unsupported file type');
      }

      const contacts = await processExcelData(jsonData);
      if (contacts.length === 0) {
        Alert.alert('Warning', 'No valid contacts found in the file');
        return;
      }

      setSelectedContacts(prev => [...prev, ...contacts]);
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (err) {
      console.error('File import error:', err);
      Alert.alert('Error', 'Failed to import contacts. Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    if (selectedContacts.length === 0) {
      Alert.alert('Error', 'At least one contact is required');
      return;
    }

    const normalizedContacts = selectedContacts.map(contact => ({
      ...contact,
      phoneNumbers: contact?.phoneNumbers?.map(phone => ({
        ...phone,
        number: normalizePhoneNumber(phone.number || ''),
        digits: getDigits(phone.number || ''),
        countryCode: phone.number?.startsWith('+') ? phone.number.split(' ')[0] : '+91',
      })),
    }));

    onSave({
      name: groupName,
      description,
      contacts: normalizedContacts,
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
              onDone={(contacts: Contacts.Contact[]) => {
                setSelectedContacts(contacts);
                setShowContactSelector(false);
              }}
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
