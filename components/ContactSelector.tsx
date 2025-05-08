import * as Contacts from 'expo-contacts';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

type Contact = Contacts.Contact;

interface ContactSelectorProps {
  visible: boolean;
  onClose: () => void;
  onDone: (selectedContacts: Contact[]) => void;
  initialSelectedContacts?: Contact[];
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ContactSelector({
  visible,
  onClose,
  onDone,
  initialSelectedContacts = [],
}: ContactSelectorProps) {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>(initialSelectedContacts);
  const [deviceContacts, setDeviceContacts] = useState<Contact[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalContacts, setTotalContacts] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const CONTACTS_PER_PAGE = 40;
  const scrollViewRef = useRef<ScrollView>(null);
  const isMounted = useRef(true);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      isMounted.current = false;
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      loadAllContacts();
    }
  }, [visible]);

  const loadAllContacts = async () => {
    try {
      setIsLoading(true);
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.Name,
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Image,
            Contacts.Fields.Emails,
            Contacts.Fields.Addresses
          ],
          pageSize: 10000,
        });

        if (isMounted.current) {
          const uniqueContacts = data.reduce((acc: Contact[], current) => {
            if (!current.name || !current.phoneNumbers?.length) return acc;

            const isDuplicate = acc.some(contact => {
              if (!contact.name || !contact.phoneNumbers?.length) return false;
              
              if (contact.name.toLowerCase() === current.name.toLowerCase()) {
                const currentPhones = current.phoneNumbers?.map(p => p.number?.replace(/\D/g, '')) || [];
                const existingPhones = contact.phoneNumbers?.map(p => p.number?.replace(/\D/g, '')) || [];
                return currentPhones.some(phone => 
                  phone && existingPhones.includes(phone)
                );
              }
              return false;
            });

            if (!isDuplicate) {
              acc.push(current);
            }
            return acc;
          }, []);

          const sortedContacts = uniqueContacts.sort((a, b) => {
            const nameA = a.name?.toLowerCase() || '';
            const nameB = b.name?.toLowerCase() || '';
            return nameA.localeCompare(nameB);
          });

          setAllContacts(sortedContacts);
          setTotalContacts(sortedContacts.length);
          
          const initialContacts = sortedContacts.slice(0, CONTACTS_PER_PAGE);
          setDeviceContacts(initialContacts);
          setHasMore(sortedContacts.length > CONTACTS_PER_PAGE);
          setPage(1);
        }
      }
    } catch (error) {
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to load contacts');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const loadMoreContacts = useCallback(async () => {
    if (!hasMore || isLoadingRef.current || !isMounted.current || searchQuery) return;

    try {
      isLoadingRef.current = true;
      setIsLoadingMore(true);
      
      const nextPage = page + 1;
      const startIndex = (nextPage - 1) * CONTACTS_PER_PAGE;
      const endIndex = startIndex + CONTACTS_PER_PAGE;
      const nextContacts = allContacts.slice(startIndex, endIndex);

      if (isMounted.current && nextContacts.length > 0) {
        setDeviceContacts(prev => [...prev, ...nextContacts]);
        setPage(nextPage);
        setHasMore(endIndex < allContacts.length);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to load more contacts');
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      }
    }
  }, [hasMore, page, allContacts, searchQuery]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (searchQuery || !hasMore || isLoadingRef.current) return;    

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 50;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom) {
      loadMoreContacts();
    }
  }, [hasMore, searchQuery, loadMoreContacts]);

  const filteredContacts = searchQuery
    ? allContacts.filter(contact => {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = contact.name?.toLowerCase().includes(searchLower);
        const phoneMatch = contact.phoneNumbers?.some(phone => 
          phone.number?.toLowerCase().includes(searchLower)
        );
        return nameMatch || phoneMatch;
      })
    : deviceContacts;

  const toggleContactSelection = useCallback((contact: Contact) => {
    setSelectedContacts(prev =>
      prev.some(c => c.id === contact.id)
        ? prev.filter(c => c.id !== contact.id)
        : [...prev, contact]
    );
  }, []);

  const renderContactItem = useCallback((contact: Contact, index: number) => {
    const isSelected = selectedContacts.some(c => c.id === contact.id);
    const displayName = contact.name || 'Unknown Contact';
    const phoneNumber = contact.phoneNumbers?.[0]?.number || 'No number';
    const initials = displayName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <TouchableOpacity
        key={`${contact.id}-${index}`}
        className={`py-2.5 px-3 flex-row items-center justify-between ${
          isSelected ? 'bg-primary/5' : ''
        }`}
        onPress={() => toggleContactSelection(contact)}
      >
        <View className="flex-row items-center flex-1">
          <View className="items-center justify-center w-8 h-8 mr-2.5 bg-gray-100 rounded-full">
            <Text className="text-sm font-medium text-gray-600">
              {initials}
            </Text>
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
  }, [selectedContacts, toggleContactSelection]);

  const handleDone = () => {
    onDone(selectedContacts);
    onClose();
  };

  if (!visible) return null;

  const containerHeight = keyboardVisible 
    ? SCREEN_HEIGHT * 0.6 - keyboardHeight
    : SCREEN_HEIGHT * 0.85;

  return (
    <View style={{ height: containerHeight }} className="bg-white rounded-t-3xl">
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-lg font-bold text-gray-900">Select Contacts</Text>
            <Text className="mt-0.5 text-sm text-gray-500">Choose contacts for your group</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="items-center justify-center w-8 h-8 rounded-full bg-gray-50"
          >
            <Icon name="close" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center mb-2">
          <View className="flex-row items-center flex-1 px-3 py-2 bg-gray-50 rounded-xl">
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
            />
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-medium text-gray-500">
            {selectedContacts.length} contacts selected
          </Text>
          <View className="flex-row space-x-2">
            {selectedContacts.length > 0 && (
              <TouchableOpacity
                onPress={() => setSelectedContacts([])}
                className="px-2.5 py-0.5 bg-gray-100 rounded-full"
              >
                <Text className="text-xs font-medium text-gray-600">Clear all</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setSelectedContacts(allContacts)}
              className="px-2.5 py-0.5 bg-gray-100 rounded-full"
            >
              <Text className="text-xs font-medium text-gray-600">Select all</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        className="flex-1"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {isLoading ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text className="mt-3 text-sm text-gray-500">Loading contacts...</Text>
          </View>
        ) : filteredContacts.length > 0 ? (
          <>
            {filteredContacts.map((contact, index) => renderContactItem(contact, index))}
            {!searchQuery && (
              <View className="items-center py-3">
                {isLoadingMore ? (
                  <>
                    <ActivityIndicator size="small" color="#1E3A8A" />
                    <Text className="mt-1.5 text-xs text-gray-500">Loading more contacts...</Text>
                  </>
                ) : (
                  <Text className="text-xs text-gray-500">
                    {hasMore ? (
                      `Loaded ${deviceContacts.length} of ${totalContacts} contacts`
                    ) : (
                      `All ${totalContacts} contacts loaded`
                    )}
                  </Text>
                )}
              </View>
            )}
          </>
        ) : (
          <View className="items-center py-8">
            <View className="items-center justify-center w-12 h-12 mb-3 bg-gray-100 rounded-full">
              <Icon name="search" size={20} color="#94a3b8" />
            </View>
            <Text className="text-sm text-center text-gray-500">No contacts found</Text>
          </View>
        )}
      </ScrollView>

      <View className="p-3 border-t border-gray-100">
        <TouchableOpacity 
          className="items-center py-3 rounded-xl bg-primary" 
          onPress={handleDone}
        >
          <Text className="text-sm font-semibold text-white">
            Done • {selectedContacts.length} selected
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
