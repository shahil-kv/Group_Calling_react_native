import * as Contacts from 'expo-contacts';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  EmitterSubscription,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/FontAwesome';

const MODAL_HEIGHT = Math.floor(Dimensions.get('window').height * 0.85);
const CONTACTS_PER_PAGE = 40;

export interface ExtendedContact extends Contacts.Contact {
  isContactFromDevice?: boolean;
}

interface ContactSelectorProps {
  visible: boolean;
  onClose: () => void;
  onDone: (selectedContacts: ExtendedContact[]) => void;
  initialSelectedContacts?: ExtendedContact[];
}

interface ContactItemProps {
  item: ExtendedContact;
  isSelected: boolean;
  toggleContact: (c: ExtendedContact) => void;
}

const ContactItem = memo(({ item, isSelected, toggleContact }: ContactItemProps) => {
  const displayName = item.name || 'Unknown Contact';
  const phoneNumber = item.phoneNumbers?.[0]?.number || 'No number';
  const initials = displayName
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between py-2.5 px-3 ${
        isSelected ? 'bg-primary/5' : 'bg-transparent'
      }`}
      onPress={() => toggleContact(item)}
      accessibilityLabel={`Select contact ${displayName}`}
    >
      <View className="flex-row items-center flex-1">
        <View className="items-center justify-center w-8 h-8 mr-2.5 bg-gray-100 rounded-full">
          <Text className="text-sm font-medium text-gray-600">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
            {phoneNumber}
          </Text>
        </View>
      </View>
      {isSelected && (
        <View className="items-center justify-center w-5 h-5 rounded-full bg-primary">
          <Icon name="check" size={12} color="#FFFFFF" />
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [fabOpacity] = useState(new Animated.Value(1));
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Normalize phone numbers
  const normalizePhoneNumber = (phone: string): string => {
    const phoneNumber = parsePhoneNumberFromString(phone, 'IN');
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatInternational();
    }
    return phone;
  };

  // Clean contact ID for consistency
  const cleanContactId = (id: string) => id.replace(':ABPerson', '');

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setAllContacts([]);
      setFilteredContacts([]);
      setSelectedContacts([]);
      setSearchQuery('');
      setIsLoading(false);
      setPage(1);
      setHasMore(true);
      setIsLoadingMore(false);
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    }
  }, [visible]);

  // Initialize selected contacts when the modal opens
  useEffect(() => {
    if (visible) {
      setSelectedContacts(
        initialSelectedContacts.map(contact => ({
          ...contact,
          id: cleanContactId(contact.id as string),
          phoneNumbers: contact?.phoneNumbers?.map(phone => ({
            ...phone,
            number: normalizePhoneNumber(phone.number || ''),
            digits: phone.number?.replace(/\D/g, '') || '',
            countryCode: phone.number?.startsWith('+') ? phone.number.split(' ')[0] : '+91',
          })),
          isContactFromDevice: contact.isContactFromDevice ?? true,
        }))
      );

      // Check if keyboard is already visible when component mounts
      Keyboard.isVisible() && setIsKeyboardVisible(true);
    }
  }, [visible, initialSelectedContacts]);

  // Load contacts on open
  useEffect(() => {
    if (!visible) return;
    setIsLoading(true);
    (async () => {
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please grant access to contacts.');
          setAllContacts([]);
          setFilteredContacts([]);
          return;
        }
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.ID,
            Contacts.Fields.Name,
            Contacts.Fields.FirstName,
            Contacts.Fields.LastName,
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Image,
            Contacts.Fields.Emails,
            Contacts.Fields.Addresses,
          ],
          pageSize: 10000,
        });

        const filtered = data
          .filter(c => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
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
            isContactFromDevice: true, // Device contacts
          }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        setAllContacts(filtered);
        setFilteredContacts(filtered.slice(0, CONTACTS_PER_PAGE));
        setPage(1);
        setHasMore(filtered.length > CONTACTS_PER_PAGE);
      } catch (e) {
        Alert.alert('Error', 'Failed to load contacts');
        setAllContacts([]);
        setFilteredContacts([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [visible]);

  // Filter contacts based on search query
  useEffect(() => {
    if (!allContacts.length) {
      setFilteredContacts([]);
      return;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const filtered = allContacts.filter(contact => {
        return (
          (contact.name && contact.name.toLowerCase().includes(q)) ||
          (contact.phoneNumbers &&
            contact.phoneNumbers.some((p: Contacts.PhoneNumber) =>
              p.number?.toLowerCase().includes(q)
            ))
        );
      });
      setFilteredContacts(filtered);
      setHasMore(false); // Disable pagination while searching
    } else {
      // Reset to paginated view when search query is cleared
      const paginated = allContacts.slice(0, page * CONTACTS_PER_PAGE);
      setFilteredContacts(paginated);
      setHasMore(paginated.length < allContacts.length);
    }
  }, [searchQuery, allContacts, page]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || searchQuery) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      const nextPage = page + 1;
      const nextContacts = allContacts.slice(0, nextPage * CONTACTS_PER_PAGE);
      setFilteredContacts(nextContacts);
      setPage(nextPage);
      setHasMore(nextContacts.length < allContacts.length);
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMore, searchQuery, page, allContacts]);

  // Handle keyboard visibility and FAB animation
  useEffect(() => {
    if (!visible) return;

    const checkKeyboard = async () => {
      const isKeyboardOpen = await Keyboard.isVisible();
      if (isKeyboardOpen) {
        setIsKeyboardVisible(true);
        if (Platform.OS === 'ios') {
          const estimatedHeight = Math.floor(Dimensions.get('window').height * 0.33);
          setKeyboardHeight(estimatedHeight);
        } else {
          setKeyboardHeight(300);
        }
      }
    };

    checkKeyboard();

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener: EmitterSubscription = Keyboard.addListener(showEvent, e => {
      const height = e.endCoordinates.height;
      setKeyboardHeight(height);
      setIsKeyboardVisible(true);
      Animated.timing(fabOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    const hideListener: EmitterSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      Animated.timing(fabOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [visible, fabOpacity]);

  const toggleContact = useCallback((contact: ExtendedContact) => {
    setSelectedContacts(prev =>
      prev.some(c => c.id === contact.id)
        ? prev.filter(c => c.id !== contact.id)
        : [...prev, { ...contact, isContactFromDevice: true }]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedContacts([]), []);

  const selectAll = useCallback(() => {
    const updatedContacts = filteredContacts.map(contact => ({
      ...contact,
      isContactFromDevice: true,
    }));
    setSelectedContacts(updatedContacts);
  }, [filteredContacts]);

  if (!visible) return null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 rounded-t-[30px] bg-white overflow-hidden">
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-xl font-bold text-gray-900">Select Contacts</Text>
              <Text className="mt-0.5 text-sm text-gray-500">Choose contacts for your group</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="items-center justify-center w-8 h-8 rounded-full bg-gray-50"
              accessibilityLabel="Close contact selector"
            >
              <Icon name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center mb-2">
            <View className="flex-row items-center flex-1 px-3 py-2 bg-gray-50 rounded-2xl">
              <Icon name="search" size={14} color="#64748b" />
              <TextInput
                className="flex-1 px-2 text-sm"
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
          </View>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-xs font-medium text-gray-500">
              {selectedContacts.length} contacts selected
            </Text>
            <View className="flex-row gap-2">
              {selectedContacts.length > 0 && (
                <TouchableOpacity
                  onPress={clearSelection}
                  className="px-3.5 py-2 bg-gray-100 rounded-full"
                  accessibilityLabel="Clear all selected contacts"
                >
                  <Text className="text-xs font-medium text-gray-600">Clear all</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={selectAll}
                className="px-3.5 py-2 bg-gray-100 rounded-full"
                accessibilityLabel="Select all contacts"
              >
                <Text className="text-xs font-medium text-gray-600">Select all</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          {isLoading ? (
            <View className="items-center justify-center flex-1 py-8">
              <ActivityIndicator size="large" color="#1E3A8A" />
              <Text className="mt-3 text-sm text-gray-500">Loading contacts...</Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View className="items-center py-8">
              <View className="items-center justify-center w-12 h-12 mb-3 bg-gray-100 rounded-full">
                <Icon name="search" size={20} color="#94a3b8" />
              </View>
              <Text className="text-sm text-center text-gray-500">No contacts found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={item => (item.id ? String(item.id) : `contact-${Math.random()}`)}
              renderItem={({ item }) => (
                <ContactItem
                  item={item}
                  isSelected={selectedContacts.some(c => c.id === item.id)}
                  toggleContact={toggleContact}
                />
              )}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                !searchQuery && hasMore ? (
                  <View className="items-center py-3">
                    {isLoadingMore ? (
                      <ActivityIndicator size="small" color="#1E3A8A" />
                    ) : (
                      <Text className="text-xs text-gray-500">Scroll to load more...</Text>
                    )}
                  </View>
                ) : null
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 80 }}
              initialNumToRender={20}
              maxToRenderPerBatch={40}
              windowSize={10}
            />
          )}
        </KeyboardAvoidingView>
        <Animated.View
          className="absolute left-0 right-0 z-50 items-center"
          style={{
            bottom: keyboardHeight > 0 ? keyboardHeight + 12 : 24,
            opacity: fabOpacity,
          }}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            className="min-w-[180px] items-center justify-center py-3.5 rounded-3xl bg-primary shadow-lg"
            onPress={() => {
              onDone(selectedContacts);
            }}
            accessibilityLabel="Done selecting contacts"
            activeOpacity={0.85}
          >
            <Text className="text-base font-semibold text-white">
              Done • {selectedContacts.length} selected
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
