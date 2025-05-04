import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CallStatus, useCallStore } from '../../stores/callStore';
import { Contact, useContactStore } from '../../stores/contactStore';
import { useGroupStore } from '../../stores/groupStore';
// import { Phone, User, PhoneOff, Check, X, Users, UserGroup, Mic, MessageSquare } from 'lucide-react-native';
// import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import Icon from 'react-native-vector-icons/FontAwesome';

interface Group {
  id: string;
  name: string;
  contacts: Contact[];
}

// Mock implementation - would be replaced with actual calling libraries
const mockInitiateCall = (phoneNumber: string): Promise<void> => {
  return new Promise(resolve => {
    // Simulate API call or native module
    setTimeout(() => {
      console.log(`Initiating call to ${phoneNumber}`);
      resolve();
    }, 500);
  });
};

export default function CallingScreen() {
  // const { user } = useAuth();
  const { groups } = useGroupStore();
  const { contacts } = useContactStore();
  const { currentCall, startCall, endCall, moveToNextContact, updateStatus } = useCallStore();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [message, setMessage] = useState('');
  const [isSelectingContacts, setIsSelectingContacts] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedMessage, setRecordedMessage] = useState('');

  const isCallActive = currentCall.status !== 'idle';

  // Get current contact based on index
  const currentContact = isCallActive && currentCall.contacts[currentCall.currentIndex];

  // Simulated call detection - would use react-native-call-detection in real implementation
  useEffect(() => {
    if (currentCall.status === 'calling' && currentContact) {
      const timer = setTimeout(() => {
        // Simulate the call being answered
        updateStatus('connected');

        // In a real app, this would be handled by the call detection library
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Simulate the call being completed after some time
        const endTimer = setTimeout(() => {
          const moveSuccess = moveToNextContact();
          if (!moveSuccess) {
            // All contacts have been called
            updateStatus('completed');
          }
        }, 3000);

        return () => clearTimeout(endTimer);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentCall.status, currentCall.currentIndex]);

  const handleStartCall = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Contacts Selected', 'Please select at least one contact to call.');
      return;
    }

    const contactLimit = false ? 500 : 200;
    if (selectedContacts.length > contactLimit) {
      Alert.alert(
        'Contact Limit Exceeded',
        `Free users can call up to 200 contacts. Upgrade to Pro to call up to 500 contacts.`
      );
      return;
    }

    // if (user?.isPro && recordedMessage) {
    //   // For Pro users with a recorded message
    //   startCall(selectedContacts, recordedMessage, true, getGroupName());
    // } else {
    //   // For Free users or Pro users without a recorded message
    //   startCall(selectedContacts, message, false, getGroupName());
    // }
  };

  const handleEndCall = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    endCall();
  };

  const getCallStatusColor = (status: CallStatus) => {
    switch (status) {
      case 'calling':
        return 'bg-warning';
      case 'connected':
        return 'bg-success';
      case 'completed':
        return 'bg-secondary';
      case 'failed':
        return 'bg-error';
      default:
        return 'bg-gray-400';
    }
  };

  const getCallStatusText = (status: CallStatus) => {
    switch (status) {
      case 'calling':
        return 'Calling...';
      case 'connected':
        return 'Connected';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Ready';
    }
  };

  const handleGroupSelect = (groupId: string | null) => {
    setSelectedGroup(groupId);

    if (groupId) {
      const group = groups.find((g: Group) => g.id === groupId);
      if (group) {
        setSelectedContacts(group.contacts);
      }
    } else {
      setSelectedContacts([]);
    }
  };

  const toggleContactSelection = (contact: Contact) => {
    if (selectedContacts.some((c: Contact) => c.id === contact.id)) {
      setSelectedContacts(selectedContacts.filter((c: Contact) => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const getGroupName = () => {
    if (selectedGroup) {
      const group = groups.find((g: Group) => g.id === selectedGroup);
      return group?.name;
    }
    return undefined;
  };

  const handleRecordMessage = () => {
    // This would use audio recording APIs in a real implementation
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setRecordedMessage('This is a pre-recorded message. Thank you for your attention!');
      Alert.alert('Message Recorded', 'Your message has been recorded successfully.');
    }, 2000);
  };

  if (isCallActive) {
    return (
      <View className="flex-1 bg-background">
        <View className="px-5 pt-14 pb-4">
          <Text className="text-2xl font-bold text-dark">Calling</Text>
          <Text className="text-gray-500">{currentCall.groupName || 'Custom Call'}</Text>
        </View>

        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-primary/10 w-24 h-24 rounded-full items-center justify-center mb-6">
            <Icon name="user" size={48} color="#1E3A8A" />
          </View>

          <Text className="text-2xl font-bold text-center mb-2">Shahil</Text>
          <Text className="text-gray-500 text-lg text-center mb-6">9846786928</Text>

          <View className={`${getCallStatusColor(currentCall.status)} px-4 py-2 rounded-full mb-8`}>
            <Text className="text-white font-medium">{getCallStatusText(currentCall.status)}</Text>
          </View>

          {currentCall.status === 'connected' && currentCall.message && (
            <View className="bg-white rounded-lg p-4 mb-8 w-full">
              <Text className="text-gray-500 mb-2 text-center">Your message:</Text>
              <Text className="text-dark text-center">{currentCall.message}</Text>
            </View>
          )}

          <View className="w-full bg-gray-200 h-2 rounded-full mb-2">
            <View
              className="bg-primary h-2 rounded-full"
              style={{
                width: `${(currentCall.currentIndex / currentCall.contacts.length) * 100}%`,
              }}
            />
          </View>
          <Text className="text-gray-500 mb-8">
            {currentCall.currentIndex + 1} of {currentCall.contacts.length} contacts
          </Text>

          <TouchableOpacity
            className="bg-error w-16 h-16 rounded-full items-center justify-center"
            onPress={handleEndCall}
          >
            <Icon name="phone-off" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-14 pb-4">
        <Text className="text-2xl font-bold text-dark">Start a Call</Text>
        <Text className="text-gray-500">Call your contacts sequentially</Text>
      </View>

      <ScrollView className="px-5">
        <View className="mb-6">
          <Text className="text-lg font-bold text-dark mb-3">Select Group</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <TouchableOpacity
              className={`mr-3 py-2 px-4 rounded-lg ${
                selectedGroup === null ? 'bg-primary' : 'bg-gray-200'
              }`}
              onPress={() => handleGroupSelect(null)}
            >
              <Text className={selectedGroup === null ? 'text-white' : 'text-gray-700'}>
                Custom
              </Text>
            </TouchableOpacity>

            {groups.map((group: Group) => (
              <TouchableOpacity
                key={group.id}
                className={`mr-3 py-2 px-4 rounded-lg ${
                  selectedGroup === group.id ? 'bg-primary' : 'bg-gray-200'
                }`}
                onPress={() => handleGroupSelect(group.id)}
              >
                <Text className={selectedGroup === group.id ? 'text-white' : 'text-gray-700'}>
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-dark">Selected Contacts</Text>
            <TouchableOpacity onPress={() => setIsSelectingContacts(true)}>
              <Text className="text-secondary">{selectedGroup ? 'Change' : 'Select'}</Text>
            </TouchableOpacity>
          </View>

          {selectedContacts.length > 0 ? (
            <View className="bg-white rounded-lg p-4">
              <Text className="text-gray-500 mb-2">
                {selectedContacts.length} contacts selected
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedContacts.slice(0, 5).map((contact: Contact, index: number) => (
                  <View key={contact.id} className="items-center mr-4">
                    <View className="bg-primary/10 w-12 h-12 rounded-full items-center justify-center mb-1">
                      <Icon name="user" size={24} color="#1E3A8A" />
                    </View>
                    <Text className="text-dark text-xs" numberOfLines={1}>
                      {contact.name}
                    </Text>
                  </View>
                ))}
                {selectedContacts.length > 5 && (
                  <View className="items-center">
                    <View className="bg-gray-200 w-12 h-12 rounded-full items-center justify-center mb-1">
                      <Text className="font-bold">+{selectedContacts.length - 5}</Text>
                    </View>
                    <Text className="text-dark text-xs">More</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          ) : (
            <View className="bg-white rounded-lg p-6 items-center">
              <Text className="text-gray-500 text-center mb-4">
                No contacts selected. Select a group or add contacts individually.
              </Text>
              <TouchableOpacity
                className="bg-secondary py-2 px-4 rounded-lg"
                onPress={() => setIsSelectingContacts(true)}
              >
                <Text className="text-white font-medium">Select Contacts</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-dark mb-3">Message</Text>
          <View className="bg-white rounded-lg p-4">
            {false ? (
              <View>
                <View className="mb-4">
                  <TouchableOpacity
                    className={`bg-gray-100 p-4 rounded-lg flex-row items-center justify-between ${
                      isRecording ? 'bg-error/10' : ''
                    }`}
                    onPress={handleRecordMessage}
                  >
                    <Text className={`${isRecording ? 'text-error' : 'text-gray-700'} font-medium`}>
                      {isRecording
                        ? 'Recording...'
                        : recordedMessage
                        ? 'Re-record Message'
                        : 'Record Voice Message'}
                    </Text>
                    <Icon name="microphone" size={20} color={isRecording ? '#EF4444' : '#64748b'} />
                  </TouchableOpacity>
                </View>

                {recordedMessage ? (
                  <View className="bg-gray-100 p-3 rounded-lg">
                    <Text className="text-gray-700">{recordedMessage}</Text>
                  </View>
                ) : (
                  <Text className="text-gray-500 text-sm">
                    Pro users can record a voice message that will be played automatically to each
                    contact.
                  </Text>
                )}
              </View>
            ) : (
              <View>
                <TextInput
                  className="bg-gray-100 p-3 rounded-lg"
                  placeholder="Enter your message to speak live on calls"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  style={{ height: 100, textAlignVertical: 'top' }}
                />
                <Text className="text-gray-500 text-sm mt-2">
                  Free users will speak this message live during each call.
                  <Text className="text-secondary"> Upgrade to Pro</Text> to use automated message
                  playback.
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          className={`bg-primary rounded-lg py-4 items-center mb-8 ${
            selectedContacts.length === 0 ? 'opacity-50' : ''
          }`}
          onPress={handleStartCall}
          disabled={selectedContacts.length === 0}
        >
          <Text className="text-white font-bold text-lg">Start Calling</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Contact Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSelectingContacts}
        onRequestClose={() => setIsSelectingContacts(false)}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
            <Text className="text-xl font-bold">Select Contacts</Text>
            <TouchableOpacity onPress={() => setIsSelectingContacts(false)}>
              <Icon name="check" size={24} color="#22C55E" />
            </TouchableOpacity>
          </View>

          <Text className="px-5 py-3 text-gray-500">
            {selectedContacts.length} contacts selected
          </Text>

          <ScrollView className="px-5">
            {contacts.map((contact: Contact) => (
              <TouchableOpacity
                key={contact.id}
                className={`py-3 flex-row items-center justify-between border-b border-gray-100 ${
                  selectedContacts.some((c: Contact) => c.id === contact.id) ? 'bg-primary/5' : ''
                }`}
                onPress={() => toggleContactSelection(contact)}
              >
                <View className="flex-row items-center">
                  <View className="bg-primary/10 w-10 h-10 rounded-full items-center justify-center mr-3">
                    <Icon name="user" size={20} color="#1E3A8A" />
                  </View>
                  <View>
                    <Text className="font-medium">{contact.name}</Text>
                    <Text className="text-gray-500 text-sm">{contact.phoneNumber}</Text>
                  </View>
                </View>

                {selectedContacts.some((c: Contact) => c.id === contact.id) && (
                  <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
                    <Icon name="check" size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
