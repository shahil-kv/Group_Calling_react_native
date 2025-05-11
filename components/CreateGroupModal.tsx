import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import ContactSelector, { ExtendedContact } from './ContactSelector';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (groupData: { name: string; description: string; contacts: ExtendedContact[] }) => void;
  isEditing?: boolean;
  initialData?: {
    name: string;
    description: string;
    contacts: ExtendedContact[];
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
  const [selectedContacts, setSelectedContacts] = useState<ExtendedContact[]>(
    initialData?.contacts || []
  );
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importedContacts, setImportedContacts] = useState<ExtendedContact[]>([]);
  const [showImportedModal, setShowImportedModal] = useState(false);

  useEffect(() => {
    if (isEditing && initialData) {
      setGroupName(initialData.name || '');
      setDescription(initialData.description || '');
      setSelectedContacts(initialData.contacts || []);
      // Separate device and imported contacts
      setImportedContacts(
        initialData.contacts?.filter(contact => !contact.isContactFromDevice) || []
      );
    }
  }, [isEditing, initialData]);

  useEffect(() => {
    if (visible && !isEditing) {
      setGroupName('');
      setDescription('');
      setSelectedContacts([]);
      setImportedContacts([]);
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

  const convertToContact = (row: any, defaultCountry = 'IN'): ExtendedContact | null => {
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
      isContactFromDevice: false, // Set to false for Excel-imported contacts
    };
  };

  const processExcelData = async (jsonData: any[], batchSize = 50): Promise<ExtendedContact[]> => {
    const contacts: ExtendedContact[] = [];
    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);
      const batchContacts = batch
        .map(row => convertToContact(row))
        .filter((contact): contact is ExtendedContact => contact !== null);
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

      setImportedContacts(contacts);
      setSelectedContacts(prev => [...prev.filter(c => c.isContactFromDevice), ...contacts]);
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (err) {
      console.error('File import error:', err);
      Alert.alert('Error', 'Failed to import contacts. Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearImported = () => {
    setImportedContacts([]);
    setSelectedContacts(prev => prev.filter(c => c.isContactFromDevice));
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
        {/* Contact Selector Modal */}
        {showContactSelector && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={showContactSelector}
            onRequestClose={() => setShowContactSelector(false)}
          >
            <SafeAreaView className="flex-1 bg-black/50">
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
                className="justify-end flex-1"
              >
                <ContactSelector
                  visible={showContactSelector}
                  onClose={() => setShowContactSelector(false)}
                  onDone={(contacts: ExtendedContact[]) => {
                    const deviceContacts = contacts.map(contact => ({
                      ...contact,
                      isContactFromDevice: true,
                    }));
                    setSelectedContacts([...deviceContacts, ...importedContacts]);
                    setShowContactSelector(false);
                  }}
                  initialSelectedContacts={selectedContacts.filter(c => c.isContactFromDevice)}
                />
              </KeyboardAvoidingView>
            </SafeAreaView>
          </Modal>
        )}

        {/* Imported Contacts Modal */}
        {showImportedModal && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={showImportedModal}
            onRequestClose={() => setShowImportedModal(false)}
          >
            <SafeAreaView className="flex-1 bg-black/50">
              <View className="bg-white rounded-t-[32px] shadow-2xl flex-1">
                <View className="p-6">
                  <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-2xl font-bold text-gray-900">Imported Contacts</Text>
                    <TouchableOpacity
                      onPress={() => setShowImportedModal(false)}
                      accessibilityLabel="Close imported contacts modal"
                      className="items-center justify-center w-10 h-10 rounded-full bg-gray-50"
                    >
                      <Icon name="close" size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  {importedContacts.length > 0 ? (
                    <FlatList
                      data={importedContacts}
                      keyExtractor={item => item.id as string}
                      renderItem={({ item }) => (
                        <View className="p-3 border-b border-gray-200">
                          <Text className="text-gray-900">{item.name}</Text>
                          <Text className="text-gray-500">{item?.phoneNumbers?.[0]?.number}</Text>
                        </View>
                      )}
                      contentContainerStyle={{ paddingBottom: 20 }}
                    />
                  ) : (
                    <Text className="text-center text-gray-500">No imported contacts</Text>
                  )}
                </View>
              </View>
            </SafeAreaView>
          </Modal>
        )}

        {/* Main Create Group Modal */}
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
                    {/* Device Contacts Selector */}
                    <TouchableOpacity
                      className="flex-row items-center justify-between px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl"
                      onPress={() => setShowContactSelector(true)}
                      accessibilityLabel="Select contacts for group"
                    >
                      <Text
                        className={
                          selectedContacts.filter(c => c.isContactFromDevice).length > 0
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }
                      >
                        {selectedContacts.filter(c => c.isContactFromDevice).length > 0
                          ? `${selectedContacts.filter(c => c.isContactFromDevice).length
                          } contacts selected`
                          : 'Select contacts'}
                      </Text>
                      <View className="flex-row items-center">
                        {selectedContacts.filter(c => c.isContactFromDevice).length > 0 && (
                          <View className="items-center justify-center w-6 h-6 mr-2 rounded-full bg-primary">
                            <Text className="text-sm font-medium text-white">
                              {selectedContacts.filter(c => c.isContactFromDevice).length}
                            </Text>
                          </View>
                        )}
                        <Icon name="chevron-right" size={16} color="#64748b" />
                      </View>
                    </TouchableOpacity>

                    {/* Import or Show Imported Contacts */}
                    <TouchableOpacity
                      className="flex-row items-center mt-4 justify-between px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl"
                      onPress={
                        importedContacts.length > 0
                          ? () => setShowImportedModal(true)
                          : handleFileImport
                      }
                      disabled={isImporting}
                      accessibilityLabel={
                        importedContacts.length > 0
                          ? 'Show imported contacts'
                          : 'Import contacts from file'
                      }
                    >
                      <View className="flex-row items-center">
                        <Icon
                          name="file-excel-o"
                          size={20}
                          color="#64748b"
                          style={{ marginRight: 12 }}
                        />
                        <Text className="text-gray-900">
                          {isImporting
                            ? 'Importing...'
                            : importedContacts.length > 0
                              ? `${importedContacts.length} contacts imported`
                              : 'Import from Excel/CSV'}
                        </Text>
                      </View>
                      {isImporting ? (
                        <ActivityIndicator size="small" color="#64748b" />
                      ) : importedContacts.length > 0 ? (
                        <TouchableOpacity
                          onPress={handleClearImported}
                          accessibilityLabel="Clear imported contacts"
                        >
                          <Icon name="close" size={16} color="#ef4444" />
                        </TouchableOpacity>
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
