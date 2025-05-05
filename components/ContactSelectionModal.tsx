import * as Contacts from 'expo-contacts';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Contact, useContactStore } from '../stores/contactStore';

interface ContactSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedContacts: Contact[];
  onContactSelect: (contact: Contact) => void;
  onClearAll: () => void;
}

export default function ContactSelectionModal({
  isVisible,
  onClose,
  selectedContacts,
  onContactSelect,
  onClearAll,
}: ContactSelectionModalProps) {
  const { contacts } = useContactStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(
    contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(searchQuery) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleImportContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });

        if (data.length > 0) {
          const formattedContacts = data
            .filter(
              contact =>
                contact.name &&
                contact.phoneNumbers &&
                contact.phoneNumbers.length > 0 &&
                contact.phoneNumbers[0].number
            )
            .map(contact => {
              const phoneNumber = contact.phoneNumbers![0].number;
              return {
                id: contact.id || Math.random().toString(),
                name: contact.name,
                phoneNumber: phoneNumber || '',
                email: contact.emails?.[0]?.email,
              };
            });

          // Update contacts in store
          formattedContacts.forEach(contact => {
            if (!contacts.some(c => c.phoneNumber === contact.phoneNumber)) {
              useContactStore.getState().addContact(contact);
            }
          });

          Alert.alert('Success', 'Contacts imported successfully');
        }
      } else {
        Alert.alert('Permission Denied', 'Please grant contacts permission to import contacts');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to import contacts');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'right', 'bottom', 'left']}>
        <View className="flex-1 mt-10">
          <View className="flex-row items-center justify-between p-5 border-b border-gray-200">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={onClose} className="mr-4">
                <Icon name="arrow-left" size={20} color="#1E3A8A" />
              </TouchableOpacity>
              <Text className="text-xl font-bold">Select Contacts</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="px-4 py-2 rounded-lg bg-primary">
              <Text className="font-medium text-white">Done</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-200">
            <Text className="text-gray-500">{selectedContacts.length} contacts selected</Text>
            <TouchableOpacity onPress={onClearAll} className="px-3 py-1 bg-gray-100 rounded-lg">
              <Text className="text-gray-700">Clear All</Text>
            </TouchableOpacity>
          </View>

          <View className="px-5 py-3">
            <View className="flex-row items-center px-3 mb-4 bg-gray-100 rounded-lg">
              <Icon name="search" size={18} color="#64748b" />
              <TextInput
                className="flex-1 px-2 py-2"
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="times-circle" size={18} color="#64748b" />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={handleImportContacts}
              className="flex-row items-center justify-center p-4 mb-4 rounded-lg bg-primary/10"
            >
              <Icon name="address-book" size={20} color="#1E3A8A" className="mr-2" />
              <Text className="ml-2 font-medium text-primary">Import from Phone Contacts</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1">
            <View className="px-5">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact: Contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    className={`py-3 flex-row items-center justify-between border-b border-gray-100 ${
                      selectedContacts.some((c: Contact) => c.id === contact.id)
                        ? 'bg-primary/5'
                        : ''
                    }`}
                    onPress={() => onContactSelect(contact)}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="items-center justify-center w-10 h-10 mr-3 rounded-full bg-primary/10">
                        <Icon name="user" size={20} color="#1E3A8A" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-medium">{contact.name}</Text>
                        <Text className="text-sm text-gray-500">{contact.phoneNumber}</Text>
                        {contact.email && (
                          <Text className="text-sm text-gray-500">{contact.email}</Text>
                        )}
                      </View>
                    </View>

                    {selectedContacts.some((c: Contact) => c.id === contact.id) && (
                      <View className="items-center justify-center w-6 h-6 rounded-full bg-primary">
                        <Icon name="check" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View className="items-center py-8">
                  <Text className="text-center text-gray-500">
                    {searchQuery
                      ? 'No contacts found matching your search'
                      : 'No contacts available'}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
