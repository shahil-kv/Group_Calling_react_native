// CreateGroupModal.tsx
import { ExtendedContact } from '@/types/contact.types';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import XLSX from 'xlsx';
import ContactSelector from './ContactSelector';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (groupData: { name: string; description: string; contacts: ExtendedContact[] }) => void;
  isEditing?: boolean;
  onModalHide: () => void;
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
  onModalHide,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<ExtendedContact[]>([]);
  const [showContactSelection, setShowContactSelection] = useState(false);
  const [showImportedContacts, setShowImportedContacts] = useState(false);
  const [importedContacts, setImportedContacts] = useState<ExtendedContact[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);

  // ⏳ INIT only after modal animation starts
  const handleModalShow = () => {
    if (isEditing && initialData) {
      setGroupName(initialData.name || '');
      setDescription(initialData.description || '');
      setSelectedContacts(initialData.contacts || []);
      setImportedContacts(initialData.contacts?.filter(c => !c.isContactFromDevice) || []);
    } else {
      setGroupName('');
      setDescription('');
      setSelectedContacts([]);
      setImportedContacts([]);
    }
    setShowContactSelection(false);
    setShowImportedContacts(false);
    setIsModalReady(true);
  };

  // 🧹 CLEANUP only after modal is hidden
  const handleModalHide = () => {
    setTimeout(() => {
      setIsModalReady(false);
      onModalHide();
    }, 20);
  };

  const normalizePhoneNumber = useCallback((phone: string): string => {
    const phoneNumber = parsePhoneNumberFromString(phone, 'IN');
    return phoneNumber && phoneNumber.isValid() ? phoneNumber.formatInternational() : phone;
  }, []);

  const convertToContact = useCallback(
    (row: any): ExtendedContact | null => {
      if (!row || typeof row !== 'object') return null;

      const name = row.name || row.Name || '';
      const phone = row.phone || row.Phone || row.phoneNumber || row.PhoneNumber || '';
      if (!name || !phone) return null;

      const normalizedPhone = normalizePhoneNumber(phone);
      const digits = normalizedPhone.replace(/\D/g, '');
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
        isContactFromDevice: false,
      };
    },
    [normalizePhoneNumber]
  );

  const processExcelData = async (jsonData: any[]): Promise<ExtendedContact[]> => {
    const contacts: ExtendedContact[] = [];
    const batchSize = Platform.OS === 'ios' ? 20 : 50;
    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);
      const batchContacts = batch
        .map(row => convertToContact(row))
        .filter((contact): contact is ExtendedContact => contact !== null);
      contacts.push(...batchContacts);
      await new Promise(resolve => setTimeout(resolve, Platform.OS === 'ios' ? 10 : 0));
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
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      const file = result.assets[0];
      const fileUri = file.uri;
      const fileType = file.mimeType as string;

      if (!fileType) {
        setIsImporting(false);
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
        setIsImporting(false);
        throw new Error('Unsupported file type');
      }

      const contacts = await processExcelData(jsonData);
      if (contacts.length === 0) {
        Alert.alert('Warning', 'No valid contacts found in the file');
        setIsImporting(false);
        return;
      }
      setSelectedContacts(prev => [...prev.filter(c => c.isContactFromDevice), ...contacts]);
      setImportedContacts(contacts);
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (err) {
      console.error('File import error:', err);
      Alert.alert('Error', 'Failed to import contacts. Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearImported = useCallback(() => {
    setImportedContacts([]);
    setSelectedContacts(prev => prev.filter(c => c.isContactFromDevice));
  }, []);

  const handleSave = useCallback(() => {
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
        digits: phone.number?.replace(/\D/g, '') || '',
        countryCode: phone.number?.startsWith('+') ? phone.number.split(' ')[0] : '+91',
      })),
    }));

    onSave({ name: groupName, description, contacts: normalizedContacts });
  }, [groupName, description, selectedContacts, onSave, normalizePhoneNumber]);

  const handleContactsSelected = useCallback((contacts: ExtendedContact[]) => {
    setSelectedContacts(prev => [
      ...contacts,
      ...prev.filter(c => !c.isContactFromDevice), // Preserve imported contacts
    ]);
    setShowContactSelection(false);
  }, []);

  const renderImportedContactItem = useCallback(({ item }: { item: ExtendedContact }) => {
    const displayName = item.name || 'Unknown Contact';
    const phoneNumber = item.phoneNumbers?.[0]?.number || 'No number';
    const initials = displayName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center flex-1">
          <View className="items-center justify-center w-10 h-10 mr-3 rounded-full bg-tertiary">
            <Text className="text-base font-medium text-gray-600">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-text-primary" numberOfLines={1}>
              {displayName}
            </Text>
            <Text className="mt-1 text-sm text-text-secondary" numberOfLines={1}>
              {phoneNumber}
            </Text>
          </View>
        </View>
      </View>
    );
  }, []);

  const ImportedContactsFooter = useCallback(
    () => (
      <View
        className="pt-4 border-t border-gray-200 bg-background-secondary"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: Platform.OS === 'ios' ? (keyboardVisible ? 20 : 20) : 20,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          className="items-center py-4 bg-primary rounded-xl"
          onPress={() => setShowImportedContacts(false)}
          accessibilityLabel="Done viewing imported contacts"
        >
          <Text className="text-lg font-semibold text-white">
            Done • {importedContacts.length} imported
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [importedContacts.length, keyboardVisible]
  );

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      onModalShow={handleModalShow}
      coverScreen={true}
      onModalHide={handleModalHide}
      swipeDirection={['down']}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={200}
      backdropTransitionOutTiming={600} // 👈 important to avoid flicker!
      hideModalContentWhileAnimating={true} // 👈 essential!
      style={{
        justifyContent: 'flex-end',
        margin: 0, // ensures it covers the screen edge to edge
      }}
      propagateSwipe
    >
      <SafeAreaView
        className="shadow-lg bg-background-secondary rounded-t-3xl"
        style={{ height: showImportedContacts || showContactSelection ? '93%' : '65%' }}
      >
        {isModalReady ? (
          <View className="relative flex-1">
            {showContactSelection ? (
              <ContactSelector
                onDone={handleContactsSelected}
                onBack={() => setShowContactSelection(false)}
                initialSelectedContacts={selectedContacts.filter(c => c.isContactFromDevice)}
              />
            ) : showImportedContacts ? (
              <>
                <View className="flex-1 p-5 pb-20">
                  <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity
                      onPress={() => setShowImportedContacts(false)}
                      accessibilityLabel="Back to group form"
                    >
                      <Icon name="arrow-left" size={20} color="#64748b" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-text-primary">Imported Contacts</Text>
                    <TouchableOpacity onPress={onClose} accessibilityLabel="Close modal">
                      <Icon name="close" size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  {importedContacts.length === 0 ? (
                    <View className="items-center justify-center flex-1">
                      <Icon name="file-excel-o" size={24} color="#94a3b8" />
                      <Text className="mt-3 text-base text-text-primary">No imported contacts</Text>
                    </View>
                  ) : (
                    <View className="flex-1">
                      <FlatList
                        data={importedContacts}
                        keyExtractor={item => item.id as string}
                        renderItem={renderImportedContactItem}
                        contentContainerStyle={{
                          paddingBottom: keyboardVisible ? 80 : 16,
                        }}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={Platform.OS === 'ios' ? 5 : 7}
                        removeClippedSubviews={true}
                      />
                    </View>
                  )}
                </View>
                <ImportedContactsFooter />
              </>
            ) : (
              <View className="flex-1 p-5">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-2xl font-bold text-text-primary">
                    {isEditing ? 'Edit Group' : 'Create New Group'}
                  </Text>
                  <TouchableOpacity onPress={onClose} accessibilityLabel="Close modal">
                    <Icon name="close" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
                <View className="flex-1 mb-4">
                  <View className="space-y-5">
                    <View>
                      <Text className="mb-2 font-medium text-text-secondary">Group Name</Text>
                      <TextInput
                        className="px-4 py-3.5 bg-background-primary border border-gray-200 rounded-xl text-text-primary"
                        placeholder="Enter group name"
                        placeholderTextColor="#64748b"
                        value={groupName}
                        onChangeText={setGroupName}
                        accessibilityLabel="Group name input"
                      />
                    </View>
                    <View>
                      <Text className="my-2 font-medium text-text-secondary">Description (Optional)</Text>
                      <TextInput
                        className="px-4 py-3.5 border border-gray-200 rounded-xl bg-background-primary text-text-primary"
                        placeholder="Enter description"
                        placeholderTextColor="#64748b"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        style={{ height: 100, textAlignVertical: 'top' }}
                        accessibilityLabel="Group description input"
                      />
                    </View>
                    <View>
                      <Text className="my-2 font-medium text-text-secondary">Add Contacts</Text>
                      <TouchableOpacity
                        className="flex-row items-center justify-between px-4 py-3.5 bg-background-primary border border-gray-200 rounded-xl"
                        onPress={() => setShowContactSelection(true)}
                        accessibilityLabel="Select contacts"
                      >
                        <Text
                          className={
                            selectedContacts.filter(c => c.isContactFromDevice).length > 0
                              ? 'text-text-primary'
                              : 'text-text-secondary'
                          }
                        >
                          {selectedContacts.filter(c => c.isContactFromDevice).length > 0
                            ? `${selectedContacts.filter(c => c.isContactFromDevice).length
                            } contacts selected`
                            : 'Select contacts'}
                        </Text>
                        <Icon name="chevron-right" size={16} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-row items-center justify-between px-4 py-3.5 bg-background-primary border border-gray-200 rounded-xl mt-3"
                        onPress={() =>
                          importedContacts.length > 0
                            ? setShowImportedContacts(true)
                            : handleFileImport()
                        }
                        disabled={isImporting}
                        accessibilityLabel={
                          importedContacts.length > 0
                            ? 'View imported contacts'
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
                          <Text className="text-text-primary">
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
                            <Icon name="trash" size={22} color="#ef4444" />
                          </TouchableOpacity>
                        ) : (
                          <Icon name="upload" size={22} color="#64748b" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View className="pt-4">
                  <TouchableOpacity
                    className="items-center py-4 bg-blue-600 rounded-xl"
                    onPress={handleSave}
                    accessibilityLabel={isEditing ? 'Update group' : 'Create group'}
                  >
                    <Text className="text-lg font-semibold text-white">
                      {isEditing ? 'Update Group' : 'Create Group'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View className="items-center justify-center flex-1">
            <ActivityIndicator size="large" color="#1E3A8A" />
          </View>
        )}
      </SafeAreaView>
    </Modal >
  );
}
