import { ExtendedContact } from '@/types/contact.types';
import * as Contacts from 'expo-contacts';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const CONTACTS_PER_PAGE = 20;

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
  const [showContactSelection, setShowContactSelection] = useState(false);
  const [showImportedContacts, setShowImportedContacts] = useState(false);
  const [allContacts, setAllContacts] = useState<ExtendedContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ExtendedContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importedContacts, setImportedContacts] = useState<ExtendedContact[]>([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      if (!isEditing) {
        setGroupName('');
        setDescription('');
        setSelectedContacts([]);
        setImportedContacts([]);
      }
      setShowContactSelection(false);
      setShowImportedContacts(false);
      setSearchQuery('');
      setPage(1);
      setHasMore(true);
    }
  }, [visible, isEditing]);

  // Set initial data for editing
  useEffect(() => {
    if (isEditing && initialData) {
      setGroupName(initialData.name || '');
      setDescription(initialData.description || '');
      setSelectedContacts(initialData.contacts || []);
      setImportedContacts(
        initialData.contacts?.filter(contact => !contact.isContactFromDevice) || []
      );
    }
  }, [isEditing, initialData]);

  const normalizePhoneNumber = useCallback((phone: string): string => {
    const phoneNumber = parsePhoneNumberFromString(phone, 'IN');
    return phoneNumber && phoneNumber.isValid() ? phoneNumber.formatInternational() : phone;
  }, []);

  const cleanContactId = useCallback((id: string) => {
    return typeof id === 'string'
      ? id.replace(':ABPerson', '')
      : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }, []);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant access to contacts.');
        setAllContacts([]);
        setFilteredContacts([]);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.ID, Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        pageSize: Platform.OS === 'ios' ? 500 : 1000,
      });

      const batchSize = Platform.OS === 'ios' ? 50 : 100;
      const processedContacts: ExtendedContact[] = [];

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const filteredBatch = batch
          .filter(
            c => (c.name && c.name.trim() !== '') || (c.phoneNumbers && c.phoneNumbers.length > 0)
          )
          .map(contact => ({
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
            isContactFromDevice: true,
          }));
        processedContacts.push(...filteredBatch);
        await new Promise(resolve => setTimeout(resolve, Platform.OS === 'ios' ? 10 : 0));
      }

      processedContacts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setAllContacts(processedContacts);
      setFilteredContacts(processedContacts.slice(0, CONTACTS_PER_PAGE));
      setPage(1);
      setHasMore(processedContacts.length > CONTACTS_PER_PAGE);
    } catch (e) {
      console.error('Error fetching contacts:', e);
      Alert.alert('Error', 'Failed to load contacts');
      setAllContacts([]);
      setFilteredContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [cleanContactId, normalizePhoneNumber]);

  useEffect(() => {
    if (visible && showContactSelection) {
      fetchContacts();
    }
  }, [visible, showContactSelection, fetchContacts]);

  const computedFilteredContacts = useMemo(() => {
    if (!allContacts.length) return [];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      let results = allContacts.filter(
        contact =>
          (contact.name && contact.name.toLowerCase().includes(q)) ||
          (contact.phoneNumbers &&
            contact.phoneNumbers.some((p: Contacts.PhoneNumber) =>
              p.number?.toLowerCase().includes(q)
            ))
      );
      if (Platform.OS === 'ios' && results.length > 100) {
        results = results.slice(0, 100);
      }
      return results;
    }
    return allContacts.slice(0, page * CONTACTS_PER_PAGE);
  }, [allContacts, searchQuery, page]);

  useEffect(() => {
    setFilteredContacts(computedFilteredContacts);
    setHasMore(!searchQuery && computedFilteredContacts.length < allContacts.length);
  }, [computedFilteredContacts, allContacts.length, searchQuery]);

  const loadMore = useCallback(() => {
    if (!hasMore || searchQuery) return;
    setPage(prev => prev + 1);
  }, [hasMore, searchQuery]);

  const toggleContact = useCallback((contact: ExtendedContact) => {
    setSelectedContacts(prev => {
      const exists = prev.some(c => c.id === contact.id);
      if (exists) {
        return prev.filter(c => c.id !== contact.id);
      }
      return [...prev, { ...contact, isContactFromDevice: true }];
    });
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

      if (result.canceled) return;

      const file = result.assets[0];
      const fileUri = file.uri;
      const fileType = file.mimeType as string;

      if (!fileType) throw new Error('File type not found');

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

  const renderContactItem = ({ item }: { item: ExtendedContact }) => {
    const isSelected = selectedContacts.some(c => c.id === item.id);
    const displayName = item.name || 'Unknown Contact';
    const phoneNumber = item.phoneNumbers?.[0]?.number || 'No number';
    const initials = displayName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <TouchableOpacity
        className={`flex-row items-center justify-between py-3 px-4 ${
          isSelected ? 'bg-blue-50' : 'bg-transparent'
        }`}
        onPress={() => toggleContact(item)}
        accessibilityLabel={`Select contact ${displayName}`}
      >
        <View className="flex-row items-center flex-1">
          <View className="items-center justify-center w-10 h-10 mr-3 bg-gray-100 rounded-full">
            <Text className="text-base font-medium text-gray-600">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
              {displayName}
            </Text>
            <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
              {phoneNumber}
            </Text>
          </View>
        </View>
        {isSelected && (
          <View className="items-center justify-center w-6 h-6 rounded-full bg-blue-600">
            <Icon name="check" size={14} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderImportedContactItem = ({ item }: { item: ExtendedContact }) => {
    const displayName = item.name || 'Unknown Contact';
    const phoneNumber = item.phoneNumbers?.[0]?.number || 'No number';
    const initials = displayName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <View className="flex-row items-center justify-between py-3 px-4">
        <View className="flex-row items-center flex-1">
          <View className="items-center justify-center w-10 h-10 mr-3 bg-gray-100 rounded-full">
            <Text className="text-base font-medium text-gray-600">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
              {displayName}
            </Text>
            <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
              {phoneNumber}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={{ margin: 0, justifyContent: 'flex-end' }}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={Platform.OS === 'ios' ? 500 : 300}
      animationOutTiming={Platform.OS === 'ios' ? 500 : 300}
      useNativeDriver={Platform.OS !== 'ios'}
      propagateSwipe={true}
      avoidKeyboard={Platform.OS === 'ios'}
    >
      <SafeAreaView className="bg-white rounded-t-3xl shadow-lg" style={{ height: '85%' }}>
        <View className="flex-1 p-5">
          {showContactSelection ? (
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity
                  onPress={() => setShowContactSelection(false)}
                  accessibilityLabel="Back to group form"
                >
                  <Icon name="arrow-left" size={20} color="#64748b" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-gray-900">Select Contacts</Text>
                <TouchableOpacity onPress={onClose} accessibilityLabel="Close modal">
                  <Icon name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center mb-4 bg-gray-100 rounded-2xl px-3 py-2">
                <Icon name="search" size={16} color="#64748b" />
                <TextInput
                  className="flex-1 ml-2 text-base"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  accessibilityLabel="Search contacts"
                />
              </View>
              {isLoading ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" color="#1E3A8A" />
                  <Text className="mt-3 text-base text-gray-500">Loading contacts...</Text>
                </View>
              ) : filteredContacts.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                  <Icon name="search" size={24} color="#94a3b8" />
                  <Text className="text-base text-gray-500 mt-3">No contacts found</Text>
                </View>
              ) : (
                <View className="flex-1">
                  <FlatList
                    data={filteredContacts}
                    keyExtractor={item => item.id as string}
                    renderItem={renderContactItem}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                      hasMore && !searchQuery ? (
                        <View className="items-center py-3">
                          <Text className="text-sm text-gray-500">Scroll to load more...</Text>
                        </View>
                      ) : null
                    }
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 16 }}
                    initialNumToRender={5}
                    maxToRenderPerBatch={10}
                    windowSize={Platform.OS === 'ios' ? 3 : 5}
                    removeClippedSubviews={true}
                  />
                </View>
              )}
              <View className="border-t border-gray-200 pt-4">
                <TouchableOpacity
                  className="items-center py-4 rounded-xl bg-blue-600"
                  onPress={() => setShowContactSelection(false)}
                  accessibilityLabel="Done selecting contacts"
                >
                  <Text className="text-lg font-semibold text-white">
                    Done • {selectedContacts.length} selected
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : showImportedContacts ? (
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity
                  onPress={() => setShowImportedContacts(false)}
                  accessibilityLabel="Back to group form"
                >
                  <Icon name="arrow-left" size={20} color="#64748b" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-gray-900">Imported Contacts</Text>
                <TouchableOpacity onPress={onClose} accessibilityLabel="Close modal">
                  <Icon name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
              {importedContacts.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                  <Icon name="file-excel-o" size={24} color="#94a3b8" />
                  <Text className="text-base text-gray-500 mt-3">No imported contacts</Text>
                </View>
              ) : (
                <View className="flex-1">
                  <FlatList
                    data={importedContacts}
                    keyExtractor={item => item.id as string}
                    renderItem={renderImportedContactItem}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 16 }}
                    initialNumToRender={5}
                    maxToRenderPerBatch={10}
                    windowSize={Platform.OS === 'ios' ? 3 : 5}
                    removeClippedSubviews={true}
                  />
                </View>
              )}
              <View className="border-t border-gray-200 pt-4">
                <TouchableOpacity
                  className="items-center py-4 rounded-xl bg-blue-600"
                  onPress={() => setShowImportedContacts(false)}
                  accessibilityLabel="Done viewing imported contacts"
                >
                  <Text className="text-lg font-semibold text-white">
                    Done • {importedContacts.length} imported
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit Group' : 'Create New Group'}
                </Text>
                <TouchableOpacity onPress={onClose} accessibilityLabel="Close modal">
                  <Icon name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
              <View className="flex-1 mb-4">
                <View className="space-y-5">
                  <View>
                    <Text className="mb-2 font-medium text-gray-700">Group Name</Text>
                    <TextInput
                      className="px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl"
                      placeholder="Enter group name"
                      value={groupName}
                      onChangeText={setGroupName}
                      accessibilityLabel="Group name input"
                    />
                  </View>
                  <View>
                    <Text className="mb-2 font-medium text-gray-700">Description (Optional)</Text>
                    <TextInput
                      className="px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl"
                      placeholder="Enter description"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                      style={{ height: 100, textAlignVertical: 'top' }}
                      accessibilityLabel="Group description input"
                    />
                  </View>
                  <View>
                    <Text className="mb-2 font-medium text-gray-700">Add Contacts</Text>
                    <TouchableOpacity
                      className="flex-row items-center justify-between px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl"
                      onPress={() => setShowContactSelection(true)}
                      accessibilityLabel="Select contacts"
                    >
                      <Text
                        className={selectedContacts.length > 0 ? 'text-gray-900' : 'text-gray-400'}
                      >
                        {selectedContacts.length > 0
                          ? `${selectedContacts.length} contacts selected`
                          : 'Select contacts'}
                      </Text>
                      <Icon name="chevron-right" size={16} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-row items-center justify-between px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl mt-3"
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
                          <Icon name="trash" size={22} color="#ef4444" />
                        </TouchableOpacity>
                      ) : (
                        <Icon name="upload" size={22} color="#64748b" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View className="border-t border-gray-200 pt-4">
                <TouchableOpacity
                  className="items-center py-4 rounded-xl bg-blue-600"
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
      </SafeAreaView>
    </Modal>
  );
}
