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
  const CONTACTS_PER_PAGE = 40;
  const scrollViewRef = useRef<ScrollView>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      isMounted.current = false;
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
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
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
          pageSize: 1000,
        });

        if (isMounted.current) {
          setAllContacts(data);
          setTotalContacts(data.length);
          
          const initialContacts = data.slice(0, CONTACTS_PER_PAGE);
          setDeviceContacts(initialContacts);
          setHasMore(data.length > CONTACTS_PER_PAGE);
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

  const loadMoreContacts = async () => {
    if (!hasMore || isLoadingMore || !isMounted.current) return;

    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const startIndex = (nextPage - 1) * CONTACTS_PER_PAGE;
      const endIndex = startIndex + CONTACTS_PER_PAGE;
      const nextContacts = allContacts.slice(startIndex, endIndex);

      if (isMounted.current) {
        if (nextContacts.length > 0) {
          setDeviceContacts(prev => [...prev, ...nextContacts]);
          setPage(nextPage);
          setHasMore(endIndex < allContacts.length);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to load more contacts');
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingMore(false);
      }
    }
  };

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && hasMore && !isLoadingMore) {
      loadMoreContacts();
    }
  }, [hasMore, isLoadingMore]);

  const filteredContacts = searchQuery
    ? allContacts.filter(contact =>
        contact.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : deviceContacts;

  const toggleContactSelection = useCallback((contact: Contact) => {
    setSelectedContacts(prev =>
      prev.some(c => c.id === contact.id)
        ? prev.filter(c => c.id !== contact.id)
        : [...prev, contact]
    );
  }, []);

  const handleDone = () => {
    onDone(selectedContacts);
    onClose();
  };

  if (!visible) return null;

  const containerHeight = keyboardVisible 
    ? SCREEN_HEIGHT * 0.7 
    : SCREEN_HEIGHT * 0.9;

  return (
    <View style={{ height: containerHeight }} className="bg-white">
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-xl font-bold text-gray-900">Select Contacts</Text>
            <Text className="mt-1 text-sm text-gray-500">Choose contacts for your group</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="items-center justify-center w-10 h-10 rounded-full bg-gray-50"
          >
            <Icon name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center mb-3">
          <View className="flex-row items-center flex-1 px-4 py-2.5 bg-gray-50 rounded-xl">
            <Icon name="search" size={16} color="#64748b" />
            <TextInput
              className="flex-1 px-3 text-base"
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
          <Text className="text-sm font-medium text-gray-500">
            {selectedContacts.length} contacts selected
          </Text>
          <View className="flex-row space-x-2">
            {selectedContacts.length > 0 && (
              <TouchableOpacity
                onPress={() => setSelectedContacts([])}
                className="px-3 py-1 bg-gray-100 rounded-full"
              >
                <Text className="text-sm font-medium text-gray-600">Clear all</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setSelectedContacts(allContacts)}
              className="px-3 py-1 bg-gray-100 rounded-full"
            >
              <Text className="text-sm font-medium text-gray-600">Select all</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        className="flex-1"
        onScroll={handleScroll}
        scrollEventThrottle={400}
        onMomentumScrollEnd={handleScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text className="mt-4 text-gray-500">Loading contacts...</Text>
          </View>
        ) : filteredContacts.length > 0 ? (
          <>
            {filteredContacts.map(contact => (
              <TouchableOpacity
                key={contact.id}
                className={`py-3 px-4 flex-row items-center justify-between ${
                  selectedContacts.some(c => c.id === contact.id) ? 'bg-primary/5' : ''
                }`}
                onPress={() => toggleContactSelection(contact)}
              >
                <View className="flex-row items-center flex-1">
                  <View className="items-center justify-center w-10 h-10 mr-3 bg-gray-100 rounded-full">
                    <Text className="font-medium text-gray-600">
                      {contact.name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{contact.name}</Text>
                    {contact.phoneNumbers?.[0] && (
                      <Text className="text-sm text-gray-500 mt-0.5">
                        {contact.phoneNumbers[0].number}
                      </Text>
                    )}
                  </View>
                </View>
                {selectedContacts.some(c => c.id === contact.id) && (
                  <View className="items-center justify-center w-6 h-6 rounded-full bg-primary">
                    <Icon name="check" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
            {!searchQuery && isLoadingMore && (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color="#1E3A8A" />
                <Text className="mt-2 text-sm text-gray-500">Loading more contacts...</Text>
              </View>
            )}
            {!searchQuery && !hasMore && deviceContacts.length > 0 && (
              <View className="items-center py-4">
                <Text className="text-sm text-gray-500">
                  Showing {deviceContacts.length} of {totalContacts} contacts
                </Text>
              </View>
            )}
          </>
        ) : (
          <View className="items-center py-12">
            <View className="items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
              <Icon name="search" size={24} color="#94a3b8" />
            </View>
            <Text className="text-center text-gray-500">No contacts found</Text>
          </View>
        )}
      </ScrollView>

      <View className="p-4 border-t border-gray-100">
        <TouchableOpacity 
          className="items-center py-3.5 rounded-xl bg-primary" 
          onPress={handleDone}
        >
          <Text className="text-base font-semibold text-white">
            Done • {selectedContacts.length} selected
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
