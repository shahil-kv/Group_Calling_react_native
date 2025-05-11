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

interface ContactSelectorProps {
  visible: boolean;
  onClose: () => void;
  onDone: (selectedContacts: Contacts.Contact[]) => void;
  initialSelectedContacts?: Contacts.Contact[];
}

interface ContactItemProps {
  item: Contacts.Contact;
  isSelected: boolean;
  toggleContact: (c: Contacts.Contact) => void;
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
  const [allContacts, setAllContacts] = useState<Contacts.Contact[]>([]);
  const [displayedContacts, setDisplayedContacts] = useState<Contacts.Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contacts.Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [fabVisible, setFabVisible] = useState(true);
  const fabAnim = useState(new Animated.Value(0))[0];

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
        }))
      );
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
          }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        setAllContacts(filtered);
        setDisplayedContacts(filtered.slice(0, CONTACTS_PER_PAGE));
        setPage(1);
        setHasMore(filtered.length > CONTACTS_PER_PAGE);
      } catch (e) {
        Alert.alert('Error', 'Failed to load contacts');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [visible]);

  const filteredContacts = searchQuery
    ? allContacts.filter(contact => {
        const q = searchQuery.toLowerCase();
        return (
          (contact.name && contact.name.toLowerCase().includes(q)) ||
          (contact.phoneNumbers &&
            contact.phoneNumbers.some((p: Contacts.PhoneNumber) =>
              p.number?.toLowerCase().includes(q)
            ))
        );
      })
    : displayedContacts;

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || searchQuery) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      const nextPage = page + 1;
      const nextContacts = allContacts.slice(0, nextPage * CONTACTS_PER_PAGE);
      setDisplayedContacts(nextContacts);
      setPage(nextPage);
      setHasMore(nextContacts.length < allContacts.length);
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMore, searchQuery, page, allContacts]);

  useEffect(() => {
    let showSub: EmitterSubscription, hideSub: EmitterSubscription;
    if (Platform.OS === 'ios') {
      showSub = Keyboard.addListener('keyboardWillShow', e => {
        setKeyboardHeight(e.endCoordinates.height);
        setFabVisible(true);
        Animated.timing(fabAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
      hideSub = Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
        setFabVisible(true);
        Animated.timing(fabAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    } else {
      showSub = Keyboard.addListener('keyboardDidShow', e => {
        setKeyboardHeight(e.endCoordinates.height);
        setFabVisible(true);
        Animated.timing(fabAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
      hideSub = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardHeight(0);
        setFabVisible(true);
        Animated.timing(fabAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }
    return () => {
      showSub?.remove();
      hideSub?.remove();
    };
  }, [fabAnim]);

  const toggleContact = useCallback((contact: Contacts.Contact) => {
    setSelectedContacts(prev =>
      prev.some(c => c.id === contact.id)
        ? prev.filter(c => c.id !== contact.id)
        : [...prev, contact]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedContacts([]), []);

  const selectAll = useCallback(() => setSelectedContacts(filteredContacts), [filteredContacts]);

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
              ListEmptyComponent={
                <View className="items-center py-8">
                  <View className="items-center justify-center w-12 h-12 mb-3 bg-gray-100 rounded-full">
                    <Icon name="search" size={20} color="#94a3b8" />
                  </View>
                  <Text className="text-sm text-center text-gray-500">No contacts found</Text>
                </View>
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 5, flexGrow: 1 }}
              initialNumToRender={20}
              maxToRenderPerBatch={40}
              windowSize={10}
            />
          )}
        </KeyboardAvoidingView>
        {fabVisible && (
          <Animated.View
            className="absolute left-0 right-0 z-50 items-center"
            style={{
              bottom: keyboardHeight > 0 ? keyboardHeight + 12 : 24,
              opacity: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1] }),
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
        )}
      </View>
    </SafeAreaView>
  );
}
