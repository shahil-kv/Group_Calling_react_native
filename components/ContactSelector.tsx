import * as Contacts from 'expo-contacts';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

type Contact = Contacts.Contact;

interface ContactSelectorProps {
  visible: boolean;
  onClose: () => void;
  onDone: (selectedContacts: Contact[]) => void;
  initialSelectedContacts?: Contact[];
}

export default function ContactSelector({
  visible,
  onClose,
  onDone,
  initialSelectedContacts = [],
}: ContactSelectorProps) {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>(initialSelectedContacts);
  const [deviceContacts, setDeviceContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const CONTACTS_PER_PAGE = 20;

  useEffect(() => {
    if (visible) {
      loadDeviceContacts();
    }
  }, [visible]);

  const loadDeviceContacts = async () => {
    try {
      setIsLoading(true);
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
          pageSize: CONTACTS_PER_PAGE,
          pageOffset: 0,
        });
        setDeviceContacts(data);
        setHasMore(data.length === CONTACTS_PER_PAGE);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreContacts = async () => {
    if (!hasMore || isLoading) return;

    try {
      setIsLoading(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
        pageSize: CONTACTS_PER_PAGE,
        pageOffset: page * CONTACTS_PER_PAGE,
      });

      if (data.length > 0) {
        setDeviceContacts(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
        setHasMore(data.length === CONTACTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load more contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = deviceContacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <View className="h-[90vh]">
      <View className="p-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Select Contacts</Text>
            <Text className="mt-1 text-gray-500">Choose contacts for your group</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="items-center justify-center w-10 h-10 rounded-full bg-gray-50"
          >
            <Icon name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center mb-4">
          <View className="flex-row items-center flex-1 px-4 py-3 bg-gray-50 rounded-xl">
            <Icon name="search" size={18} color="#64748b" />
            <TextInput
              className="flex-1 px-3 text-base"
              placeholder="Search contacts..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-gray-500">
            {selectedContacts.length} contacts selected
          </Text>
          {selectedContacts.length > 0 && (
            <TouchableOpacity
              onPress={() => setSelectedContacts([])}
              className="px-3 py-1 bg-gray-100 rounded-full"
            >
              <Text className="text-sm font-medium text-gray-600">Clear all</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setSelectedContacts(deviceContacts)}
            className="px-3 py-1 bg-gray-100 rounded-full"
          >
            <Text className="text-sm font-medium text-gray-600">Select all</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isCloseToBottom) {
            loadMoreContacts();
          }
        }}
        scrollEventThrottle={400}
      >
        {filteredContacts.length > 0 ? (
          filteredContacts.map(contact => (
            <TouchableOpacity
              key={contact.id}
              className={`py-4 px-6 flex-row items-center justify-between ${
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
          ))
        ) : (
          <View className="items-center py-12">
            <View className="items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
              <Icon name="search" size={24} color="#94a3b8" />
            </View>
            <Text className="text-center text-gray-500">No contacts found</Text>
          </View>
        )}
        {isLoading && (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color="#0000ff" />
          </View>
        )}
      </ScrollView>

      <View className="p-6 border-t border-gray-100">
        <TouchableOpacity className="items-center py-4 rounded-xl bg-primary" onPress={handleDone}>
          <Text className="text-base font-semibold text-white">
            Done • {selectedContacts.length} selected
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
