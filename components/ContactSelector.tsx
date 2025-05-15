// ContactSelector.tsx
import { ExtendedContact } from '@/types/contact.types';
import * as Contacts from 'expo-contacts';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
import Icon from 'react-native-vector-icons/FontAwesome';

interface ContactItemProps {
  item: ExtendedContact;
  isSelected: boolean;
  toggleContact: (contact: ExtendedContact) => void;
}

interface ContactSelectorProps {
  onDone: (contacts: ExtendedContact[]) => void;
  onBack: () => void;
  initialSelectedContacts?: ExtendedContact[];
}

const CONTACTS_PER_PAGE = 20;

const ContactItem = memo(({ item, isSelected, toggleContact }: ContactItemProps) => {
  const displayName = item.name || 'Unknown Contact';
  const phoneNumber = item.phoneNumbers?.[0]?.number || 'No number';
  const initials = useMemo(
    () =>
      displayName
        .split(' ')
        .map(word => word[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2),
    [displayName]
  );

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between py-3 px-4 ${isSelected ? 'bg-primary' : 'bg-transparent'
        }`}
      onPress={() => toggleContact(item)}
      accessibilityLabel={`Select contact ${displayName}`}
    >
      <View className="flex-row items-center flex-1">
        <View className="items-center justify-center w-10 h-10 mr-3 bg-gray-100 rounded-full">
          <Text className="text-base font-medium text-gray-600">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className={`text-base font-medium ${isSelected ? 'text-white' : 'text-text-primary'}`} numberOfLines={1}>
            {displayName}
          </Text>
          <Text className={`mt-1 text-sm ${isSelected ? 'text-white' : 'text-text-primary'}`} numberOfLines={1}>
            {phoneNumber}
          </Text>
        </View>
      </View>
      {isSelected && (
        <View className="items-center justify-center w-6 h-6 bg-blue-600 rounded-full">
          <Icon name="check" size={14} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function ContactSelector({
  onDone,
  onBack,
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

  const normalizePhoneNumber = useCallback((phone: string): string => {
    const phoneNumber = parsePhoneNumberFromString(phone, 'IN');
    return phoneNumber && phoneNumber.isValid() ? phoneNumber.formatInternational() : phone;
  }, []);

  const cleanContactId = useCallback((id: string) => {
    return typeof id === 'string'
      ? id.replace(':ABPerson', '')
      : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }, []);

  const normalizedInitialContacts = useMemo(() => {
    return initialSelectedContacts
      .filter(contact => contact && typeof contact === 'object' && contact.id)
      .map(contact => ({
        ...contact,
        id: cleanContactId(contact.id as string),
        phoneNumbers:
          contact?.phoneNumbers?.map(phone => ({
            ...phone,
            number: normalizePhoneNumber(phone.number || ''),
            digits: phone.number?.replace(/\D/g, '') || '',
            countryCode: phone.number?.startsWith('+') ? phone.number.split(' ')[0] : '+91',
          })) || [],
        isContactFromDevice: contact.isContactFromDevice ?? true,
      }));
  }, [initialSelectedContacts, cleanContactId, normalizePhoneNumber]);

  useEffect(() => {
    setSelectedContacts(normalizedInitialContacts);
  }, [normalizedInitialContacts]);

  useEffect(() => {
    const fetchContacts = async () => {
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
              phoneNumbers:
                contact?.phoneNumbers?.map(phone => ({
                  ...phone,
                  number: normalizePhoneNumber(phone.number || ''),
                  digits: phone.number?.replace(/\D/g, '') || '',
                  countryCode: phone.number?.startsWith('+') ? phone.number.split(' ')[0] : '+91',
                })) || [],
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
    };

    fetchContacts();
  }, [cleanContactId, normalizePhoneNumber]);

  const computedFilteredContacts = useMemo(() => {
    if (!allContacts.length) return [];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      let results = allContacts.filter(
        contact =>
          (contact.name && contact.name.toLowerCase().includes(q)) ||
          (contact.phoneNumbers &&
            contact.phoneNumbers.some(p => p.number?.toLowerCase().includes(q)))
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
    if (isLoadingMore || !hasMore || searchQuery) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setPage(prev => prev + 1);
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMore, searchQuery]);

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
    setSelectedContacts(allContacts);
  }, [allContacts]);

  return (
    <View className="flex-1 p-5 pb-20">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={onBack} accessibilityLabel="Back to group form">
          <Icon name="arrow-left" size={20} color="#64748b" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-text-primary">Select Contacts</Text>
        <View style={{ width: 20 }} />
      </View>
      <View className="flex-row items-center px-3 py-2 mb-4 bg-background-primary rounded-2xl">
        <Icon name="search" size={16} color="#64748b" />
        <TextInput
          className="flex-1 ml-2 text-base"
          placeholder="Search contacts..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search contacts"
        />
      </View>
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-xs font-medium text-text-secondary">
          {selectedContacts.length} contacts selected
        </Text>
        <View className="flex-row gap-2">
          {selectedContacts.length > 0 && (
            <TouchableOpacity
              onPress={clearSelection}
              className="px-3.5 py-2 bg-background-primary rounded-full"
              accessibilityLabel="Clear all selected contacts"
            >
              <Text className="text-xs font-medium text-text-primary">Clear all</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={selectAll}
            className="px-3.5 py-2 bg-background-primary rounded-full"
            accessibilityLabel="Select all contacts"
          >
            <Text className="text-xs font-medium text-text-primary">Select all</Text>
          </TouchableOpacity>
        </View>
      </View>
      {isLoading ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text className="mt-3 text-base text-text-primary">Loading contacts...</Text>
        </View>
      ) : filteredContacts.length === 0 ? (
        <View className="items-center justify-center flex-1">
          <Icon name="search" size={24} color="#94a3b8" />
          <Text className="mt-3 text-base text-text-primary">No contacts found</Text>
        </View>
      ) : (
        <View className="flex-1">
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
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              hasMore && !searchQuery ? (
                <View className="items-center py-3">
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color="#1E3A8A" />
                  ) : (
                    <Text className="text-sm text-text-primary">Scroll to load more...</Text>
                  )}
                </View>
              ) : null
            }
            contentContainerStyle={{ paddingBottom: 80 }}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={Platform.OS === 'ios' ? 5 : 7}
            removeClippedSubviews={true}
          />
        </View>
      )}
      <View
        className="pt-4 border-t border-gray-200 bg-background-secondary"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: Platform.OS === 'ios' ? 20 : 20,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          className="items-center py-4 bg-primary rounded-xl"
          onPress={() => onDone(selectedContacts)}
          accessibilityLabel="Done selecting contacts"
        >
          <Text className="text-lg font-semibold text-white">
            Done • {selectedContacts.length} selected
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
