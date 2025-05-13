// ContactSelector.tsx
import { ExtendedContact } from '@/types/contact.types';
import * as Contacts from 'expo-contacts';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';

interface ContactItemProps {
  item: ExtendedContact;
  isSelected: boolean;
  toggleContact: (contact: ExtendedContact) => void;
}

interface ContactSelectorProps {
  visible: boolean;
  onClose: () => void;
  onDone: (contacts: ExtendedContact[]) => void;
  initialSelectedContacts?: ExtendedContact[];
}

const CONTACTS_PER_PAGE = 20; // Reduced for better iOS performance

const ContactItem = memo(({ item, isSelected, toggleContact }: ContactItemProps) => {
  const displayName = item.name || 'Unknown Contact';
  const phoneNumber = item.phoneNumbers?.[0]?.number || 'No number';
  const initials = useMemo(
    () =>
      displayName
        .split(' ')
        .map((word: string) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    [displayName]
  );

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
});

export default function ContactSelector({
  visible,
  onClose,
  onDone,
  initialSelectedContacts = [],
}: ContactSelectorProps) {
  const [allContacts, setAllContacts] = useState<ExtendedContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ExtendedContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<ExtendedContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [modalHeight, setModalHeight] = useState('85%'); // Default modal height

  // Debug: Log when the modal is supposed to open
  useEffect(() => {
    console.log('ContactSelector modal visible:', visible);
    if (visible) {
      // On iOS, we'll use a slight delay to ensure the modal renders properly
      Platform.OS === 'ios' &&
        setTimeout(() => {
          setModalHeight('85%');
        }, 50);
    } else {
      setModalHeight('0%'); // Reset height when closing
    }
  }, [visible]);

  const normalizePhoneNumber = useCallback((phone: string): string => {
    const phoneNumber = parsePhoneNumberFromString(phone, 'IN');
    return phoneNumber && phoneNumber.isValid() ? phoneNumber.formatInternational() : phone;
  }, []);

  const cleanContactId = useCallback((id: string) => {
    if (typeof id !== 'string') return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return id.replace(':ABPerson', '');
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      // Don't clear all data immediately to prevent flickering if reopened
      setTimeout(() => {
        if (!visible) {
          setSearchQuery('');
          setPage(1);
          setHasMore(true);
          setIsLoadingMore(false);
          Keyboard.dismiss();
        }
      }, 300);
    }
  }, [visible]);

  // Set initial selected contacts when modal opens
  const normalizedInitialContacts = useMemo(() => {
    return initialSelectedContacts.map(contact => ({
      ...contact,
      id: cleanContactId(contact.id as string),
      phoneNumbers: contact?.phoneNumbers?.map(phone => ({
        ...phone,
        number: normalizePhoneNumber(phone.number || ''),
        digits: phone.number?.replace(/\D/g, '') || '',
        countryCode: phone.number?.startsWith('+') ? phone.number.split(' ')[0] : '+91',
      })),
      isContactFromDevice: contact.isContactFromDevice ?? true,
    }));
  }, [initialSelectedContacts, cleanContactId, normalizePhoneNumber]);

  useEffect(() => {
    if (visible) {
      setSelectedContacts(normalizedInitialContacts);
    }
  }, [visible, normalizedInitialContacts]);

  // Fetch contacts when modal opens - with improved iOS handling
  useEffect(() => {
    if (!visible) return;

    // For iOS, use a slight delay to ensure modal is properly shown before heavy operations
    const timer = Platform.OS === 'ios' ? 300 : 0;

    const fetchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please grant access to contacts.');
          setAllContacts([]);
          setFilteredContacts([]);
          return;
        }

        // Use a smaller page size for iOS to avoid performance issues
        const pageSize = Platform.OS === 'ios' ? 1000 : 10000;
        const fields: (Contacts.Fields | null)[] = [
          Contacts.Fields.ID,
          Contacts.Fields.Name,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Image,
          // Reducing fields for better iOS performance
          Platform.OS === 'ios' ? null : Contacts.Fields.Emails,
          Platform.OS === 'ios' ? null : Contacts.Fields.Addresses,
        ];

        // Use type assertion to tell TypeScript that filter removes null values
        const filteredFields = fields.filter((field): field is Contacts.Fields => field !== null);

        const { data } = await Contacts.getContactsAsync({
          fields: filteredFields,
          pageSize,
        });

        console.log('Fetched contacts:', data.length);

        // Process contacts in smaller batches on iOS
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

          // On iOS, we'll use a longer timeout to prevent UI freezing
          await new Promise(resolve => setTimeout(resolve, Platform.OS === 'ios' ? 10 : 0));
        }

        processedContacts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        console.log('Processed contacts:', processedContacts.length);

        setAllContacts(processedContacts);
        // Load fewer contacts initially on iOS for better performance
        const initialLoadCount = Platform.OS === 'ios' ? CONTACTS_PER_PAGE : CONTACTS_PER_PAGE * 2;
        setFilteredContacts(processedContacts.slice(0, initialLoadCount));
        setPage(1);
        setHasMore(processedContacts.length > initialLoadCount);
      } catch (e) {
        console.error('Error fetching contacts:', e);
        Alert.alert('Error', 'Failed to load contacts');
        setAllContacts([]);
        setFilteredContacts([]);
      } finally {
        setIsLoading(false);
      }
    }, timer);

    return () => clearTimeout(fetchTimeout);
  }, [visible, cleanContactId, normalizePhoneNumber]);

  // Memoized filtered contacts based on search query or pagination
  const computedFilteredContacts = useMemo(() => {
    if (!allContacts.length) return [];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      // Limit search results on iOS for performance
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
    } else {
      return allContacts.slice(0, page * CONTACTS_PER_PAGE);
    }
  }, [allContacts, searchQuery, page]);

  // Update filtered contacts and hasMore state
  useEffect(() => {
    setFilteredContacts(computedFilteredContacts);
    setHasMore(!searchQuery && computedFilteredContacts.length < allContacts.length);
  }, [computedFilteredContacts, allContacts.length, searchQuery]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || searchQuery) return;
    setIsLoadingMore(true);
    // Use RAF on iOS for smoother loading
    if (Platform.OS === 'ios') {
      requestAnimationFrame(() => {
        const nextPage = page + 1;
        setPage(nextPage);
        setIsLoadingMore(false);
      });
    } else {
      setTimeout(() => {
        const nextPage = page + 1;
        setPage(nextPage);
        setIsLoadingMore(false);
      }, 300);
    }
  }, [isLoadingMore, hasMore, searchQuery, page]);

  const toggleContact = useCallback((contact: ExtendedContact) => {
    setSelectedContacts(prev => {
      const exists = prev.some(c => c.id === contact.id);
      if (exists) {
        return prev.filter(c => c.id !== contact.id);
      }
      return [...prev, { ...contact, isContactFromDevice: true }];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedContacts([]);
  }, []);

  const selectAll = useCallback(() => {
    const updatedContacts = filteredContacts.map(contact => ({
      ...contact,
      isContactFromDevice: true,
    }));
    setSelectedContacts(updatedContacts);
  }, [filteredContacts]);

  // Define the modal style with proper typing
  const modalStyle: any = {
    margin: 0,
    justifyContent: 'flex-end',
    ...(Platform.OS === 'ios' && modalHeight ? { height: modalHeight } : {}),
  };
  // Memoize selected contacts count for rendering
  const selectedCount = useMemo(() => selectedContacts.length, [selectedContacts]);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={modalStyle}
      backdropOpacity={0.5}
      animationIn={Platform.OS === 'ios' ? 'slideInUp' : 'fadeInUp'}
      animationOut={Platform.OS === 'ios' ? 'slideOutDown' : 'fadeOutDown'}
      animationInTiming={Platform.OS === 'ios' ? 500 : 300}
      animationOutTiming={Platform.OS === 'ios' ? 500 : 300}
      backdropTransitionInTiming={Platform.OS === 'ios' ? 500 : 300}
      backdropTransitionOutTiming={Platform.OS === 'ios' ? 500 : 300}
      useNativeDriver={Platform.OS !== 'ios'} // Use JS driver for iOS
      propagateSwipe={true} // Important for iOS swipe gestures
      hasBackdrop={true}
      avoidKeyboard={Platform.OS === 'ios'} // Handle keyboard better on iOS
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView
          className="bg-white flex-1 rounded-t-3xl shadow-lg"
          edges={['bottom']} // Only apply safe area to bottom
          style={{
            // Fix maxHeight issues on iOS
            ...(Platform.OS === 'ios' && { maxHeight: '85%' }),
          }}
        >
          <View className="p-5 flex-1">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-gray-900">Select Contacts</Text>
              <TouchableOpacity
                onPress={onClose}
                className="p-2 rounded-full bg-gray-100"
                accessibilityLabel="Close contact selector"
              >
                <Icon name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center mb-4 bg-gray-100 rounded-2xl px-3 py-2">
              <Icon name="search" size={16} color="#64748b" />
              <TextInput
                className="flex-1 ml-2 text-base"
                placeholder="Search contacts..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Search contacts"
              />
            </View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm font-medium text-gray-500">
                {selectedCount} contacts selected
              </Text>
              <View className="flex-row gap-2">
                {selectedCount > 0 && (
                  <TouchableOpacity
                    onPress={clearSelection}
                    className="px-4 py-2 bg-gray-200 rounded-full"
                    accessibilityLabel="Clear all selected contacts"
                  >
                    <Text className="text-sm font-medium text-gray-700">Clear all</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={selectAll}
                  className="px-4 py-2 bg-gray-200 rounded-full"
                  accessibilityLabel="Select all contacts"
                >
                  <Text className="text-sm font-medium text-gray-700">Select all</Text>
                </TouchableOpacity>
              </View>
            </View>
            <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
              {isLoading ? (
                <View className="items-center justify-center flex-1 py-8">
                  <ActivityIndicator size="large" color="#1E3A8A" />
                  <Text className="mt-3 text-base text-gray-500">Loading contacts...</Text>
                </View>
              ) : filteredContacts.length === 0 ? (
                <View className="items-center py-8">
                  <View className="items-center justify-center w-14 h-14 mb-3 bg-gray-100 rounded-full">
                    <Icon name="search" size={24} color="#94a3b8" />
                  </View>
                  <Text className="text-base text-center text-gray-500">No contacts found</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredContacts}
                  keyExtractor={item => item.id as string}
                  renderItem={({ item }) => (
                    <ContactItem
                      item={item}
                      isSelected={selectedContacts.some(c => c.id === item.id)}
                      toggleContact={toggleContact}
                    />
                  )}
                  onEndReached={loadMore}
                  onEndReachedThreshold={0.3} // Lower threshold for iOS
                  ListFooterComponent={
                    !searchQuery && hasMore ? (
                      <View className="items-center py-3">
                        {isLoadingMore ? (
                          <ActivityIndicator size="small" color="#1E3A8A" />
                        ) : (
                          <Text className="text-sm text-gray-500">Scroll to load more...</Text>
                        )}
                      </View>
                    ) : null
                  }
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  initialNumToRender={5} // Reduced for iOS
                  maxToRenderPerBatch={10} // Reduced for iOS
                  windowSize={Platform.OS === 'ios' ? 3 : 5} // Reduced window size for iOS
                  removeClippedSubviews={true} // Important for performance
                  getItemLayout={
                    Platform.OS === 'ios'
                      ? undefined
                      : (data, index) => ({ length: 72, offset: 72 * index, index })
                  } // Fixed height for Android optimization
                />
              )}
            </KeyboardAvoidingView>
            <TouchableOpacity
              className="items-center justify-center py-4 rounded-xl bg-blue-600 mt-4"
              onPress={() => onDone(selectedContacts)}
              accessibilityLabel="Done selecting contacts"
              activeOpacity={0.8}
            >
              <Text className="text-lg font-semibold text-white">
                Done • {selectedCount} selected
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
