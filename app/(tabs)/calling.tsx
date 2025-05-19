import ContactSelector from '@/components/ContactSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useGet, usePost } from '@/hooks/useApi';
import {
  ApiContact,
  CallHistoryEntry,
  CallState,
  CallStatusData,
  Group,
} from '@/types/calling.types';
import { ExtendedContact } from '@/types/contact.types';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { io, Socket } from 'socket.io-client';

const API_URL = 'https://6811-103-165-167-98.ngrok-free.app'; // Replace with production URL

export default function CallingScreen() {
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<ExtendedContact[]>([]);
  const [isSelectingContacts, setIsSelectingContacts] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedMessage, setRecordedMessage] = useState('');
  const [currentCall, setCurrentCall] = useState<CallState>({
    status: 'idle',
    contacts: [],
    currentIndex: 0,
    sessionId: null,
    currentContact: null,
    attempt: 0,
  });
  const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([]);
  const stableUserId = useMemo(() => (user?.id != null ? String(user.id) : undefined), [user?.id]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const isCallActive = currentCall.status !== 'idle';

  const {
    data: fetchedGroups,
    refetch: fetchGroups,
    isFetching: isFetchingGroups,
  } = useGet<any, { userId: string | undefined }>(
    'group/get-groups',
    { userId: stableUserId },
    { showErrorToast: true, showSuccessToast: false, showLoader: false }
  );

  const { mutateAsync: StartCallSession } = usePost('call/call_list', {
    invalidateQueriesOnSuccess: [],
    showErrorToast: true,
    showSuccessToast: true,
    showLoader: true,
  });

  const { mutateAsync: StopCallSession } = usePost('call/stop', {
    invalidateQueriesOnSuccess: [],
    showErrorToast: true,
    showSuccessToast: true,
    showLoader: true,
  });

  useEffect(() => {
    const socketInstance: Socket = io(API_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => console.log('Socket.IO connected'));
    socketInstance.on('connect_error', error =>
      console.error('Socket.IO connection error:', error)
    );
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !currentCall.sessionId) return;

    socket.on('callStatusUpdate', (data: CallStatusData) => {
      if (data.sessionId !== currentCall.sessionId) return;

      setCurrentCall(prev => ({
        ...prev,
        status: data.status,
        currentIndex: data.currentIndex || prev.currentIndex,
        currentContact: data.currentContact,
        attempt: data.attempt,
      }));

      if (
        data.currentIndex >= data.totalCalls ||
        data.status === 'completed' ||
        data.status === 'stopped'
      ) {
        setCurrentCall({
          status: 'idle',
          contacts: [],
          currentIndex: 0,
          sessionId: null,
          currentContact: null,
          attempt: 0,
        });
        setCallHistory([]);
        Alert.alert('Call Session Ended', 'All calls have been completed.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    });

    socket.on('callHistoryUpdate', (data: { sessionId: number; callHistory: CallHistoryEntry }) => {
      if (data.sessionId !== currentCall.sessionId) return;

      setCallHistory(prev => {
        const existingIndex = prev.findIndex(entry => entry.id === data.callHistory.id);
        if (existingIndex >= 0) {
          const updatedHistory = [...prev];
          updatedHistory[existingIndex] = data.callHistory;
          return updatedHistory;
        }
        return [...prev, data.callHistory];
      });
    });

    return () => {
      socket.off('callStatusUpdate');
      socket.off('callHistoryUpdate');
    };
  }, [socket, currentCall.sessionId]);

  const validContacts = useMemo(() => {
    return selectedContacts
      .filter(contact => contact.phoneNumbers?.[0]?.number?.trim())
      .map(contact => ({
        id: contact.id || `contact-${Date.now()}-${Math.random()}`,
        name: contact.name || 'Unknown Contact',
        phoneNumber: contact.phoneNumbers?.[0]?.number?.trim() || '',
      }));
  }, [selectedContacts]);

  const confirmSequentialCalls = () => {
    return new Promise(resolve => {
      Alert.alert(
        'Start Sequential Calls',
        `This will call ${selectedContacts.length} contacts in sequence. You can stop at any time.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Start Calling', style: 'default', onPress: () => resolve(true) },
        ]
      );
    });
  };

  const handleStartCall = async () => {
    try {
      const MAX_CONTACTS_FREE = 50;
      const MAX_CONTACTS_PREMIUM = 500;

      if (selectedContacts.length === 0) {
        Alert.alert('No Contacts Selected', 'Please select at least one contact.');
        return;
      }

      const contactLimit = user?.is_premium ? MAX_CONTACTS_PREMIUM : MAX_CONTACTS_FREE;
      if (selectedContacts.length > contactLimit) {
        Alert.alert(
          'Contact Limit Exceeded',
          `Free users: ${MAX_CONTACTS_FREE} contacts. Pro: ${MAX_CONTACTS_PREMIUM}.`
        );
        return;
      }

      const confirmed = await confirmSequentialCalls();
      if (!confirmed) return;

      if (validContacts.length === 0) {
        Alert.alert('Invalid Contacts', 'No valid phone numbers found.');
        return;
      }

      const messageContent =
        user?.is_premium && recordedMessage
          ? recordedMessage
          : 'Hello, this is an automated call. Thank you!';

      const payload =
        selectedGroup === null
          ? {
              userId: Number(user?.id),
              contacts: validContacts.map(contact => ({
                name: contact.name,
                phoneNumber: contact.phoneNumber,
              })),
              groupId: 0,
              groupType: 'MANUAL',
              messageContent,
            }
          : {
              userId: Number(user?.id),
              groupId: Number(selectedGroup),
              groupType: 'USER_DEFINED',
              messageContent,
            };

      const response: any = await StartCallSession(payload);
      if (response.statusCode !== 200) {
        throw new Error(response.message || 'Failed to start call');
      }

      setCurrentCall({
        status: 'in_progress',
        contacts: validContacts,
        currentIndex: 0,
        sessionId: response.data.sessionId,
        currentContact: validContacts[0],
        attempt: 1,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start call.');
    }
  };

  const handleEndCall = useCallback(async () => {
    try {
      if (!currentCall.sessionId) return;
      const data = await StopCallSession({ sessionId: currentCall.sessionId });
      if (data.statusCode !== 200) {
        throw new Error(data.message || 'Failed to stop call session');
      }

      setCurrentCall({
        status: 'idle',
        contacts: [],
        currentIndex: 0,
        sessionId: null,
        currentContact: null,
        attempt: 0,
      });
      setCallHistory([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to end call.');
    }
  }, [currentCall, StopCallSession]);

  const handleGroupSelect = (groupId: string | null) => {
    setSelectedGroup(groupId);
    if (groupId) {
      const group = fetchedGroups?.data?.find((g: Group) => g.id === groupId);
      if (group) {
        const expoContacts: ExtendedContact[] = group.contacts
          .filter((contact: ApiContact) => contact.phone_number?.trim())
          .map((contact: ApiContact) => ({
            id: contact.contact_id || String(contact.id),
            name: contact.name || 'Unknown Contact',
            phoneNumbers: [{ number: contact.phone_number, type: 'mobile', label: 'mobile' }],
            contactType: 'person',
          }));
        setSelectedContacts(expoContacts);
      }
    } else {
      setSelectedContacts([]);
    }
  };

  const handleRecordMessage = () => {
    if (!user?.is_premium) {
      Alert.alert('Premium Feature', 'Voice recording requires Pro. Upgrade now.', [
        { text: 'Upgrade Now', onPress: () => console.log('upgrade') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setRecordedMessage('This is a pre-recorded message. Thank you!');
      Alert.alert('Message Recorded', 'Your message has been recorded.');
    }, 2000);
  };

  const getStatusDisplay = (status: string, attempt: number) => {
    console.log(status);
    switch (status) {
      case 'ACCEPTED':
        return 'Accepted';
      case 'MISSED':
        return 'Rejected'; // Display "Rejected" for missed calls
      case 'DECLINED':
        return 'Busy';
      case 'FAILED':
        return 'Failed';
      case 'IN_PROGRESS':
        return `Calling`;
      default:
        return status;
    }
  };
  if (isCallActive) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-50 to-white" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 p-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-dark">Active Call</Text>
            <TouchableOpacity onPress={handleEndCall}>
              <Icon name="times" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
          {currentCall.currentContact && (
            <View className="items-center mb-6">
              <View className="items-center justify-center w-16 h-16 mb-2 rounded-full bg-primary/10">
                <Icon name="user" size={32} color="#1E3A8A" />
              </View>
              <Text className="text-lg font-bold text-dark">{currentCall.currentContact.name}</Text>
              <Text className="text-gray-500">{currentCall.currentContact.phoneNumber}</Text>
              <Text className="mt-2 text-primary">
                {getStatusDisplay(currentCall.status, currentCall.attempt)}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="mb-3 text-lg font-bold text-dark">Call Progress</Text>
            <ScrollView>
              {currentCall.contacts.map((contact, index) => {
                const historyEntry = callHistory.find(
                  entry => entry.contact_phone === contact.phoneNumber
                );
                const status =
                  historyEntry?.status ||
                  (index === currentCall.currentIndex ? 'IN_PROGRESS' : 'PENDING');
                return (
                  <View
                    key={contact.id}
                    className="flex-row items-center p-3 mb-2 rounded-lg bg-white shadow-sm"
                  >
                    <View className="items-center justify-center w-10 h-10 mr-3 rounded-full bg-primary/10">
                      <Icon name="user" size={20} color="#1E3A8A" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-dark">{contact.name}</Text>
                      <Text className="text-sm text-gray-500">{contact.phoneNumber}</Text>
                    </View>
                    <Text
                      className={`text-sm ${
                        status === 'ACCEPTED'
                          ? 'text-green-500'
                          : status === 'FAILED' || status === 'DECLINED'
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}
                    >
                      {getStatusDisplay(status, historyEntry?.attempt || 1)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
          <TouchableOpacity
            className="bg-error rounded-lg py-3 items-center mt-4"
            onPress={handleEndCall}
          >
            <Text className="text-lg font-bold text-white">End Call Session</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-50 to-white" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View className="px-5 pt-6 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            <Icon name="phone" size={24} color="#1E3A8A" />
            <Text className="ml-2 text-2xl font-bold text-dark">Start a Call</Text>
          </View>
          <TouchableOpacity onPress={() => console.log('call history screen')}>
            <Icon name="history" size={24} color="#1E3A8A" />
          </TouchableOpacity>
        </View>
        <Text className="ml-10 text-gray-500">Call your contacts sequentially</Text>
      </View>
      <ScrollView className="flex-1">
        <View className="gap-4 px-4 space-y-4">
          <View className="p-4 bg-white rounded-lg">
            <View className="flex-row items-center mb-3">
              <Icon name="users" size={20} color="#1E3A8A" />
              <Text className="ml-2 text-lg font-bold text-dark">Select Group</Text>
            </View>
            {isFetchingGroups ? (
              <Text className="text-gray-500">Loading groups...</Text>
            ) : fetchedGroups?.data?.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                <TouchableOpacity
                  className={`mr-3 py-2 px-4 rounded-lg ${
                    selectedGroup === null ? 'bg-primary' : 'bg-gray-100'
                  }`}
                  onPress={() => handleGroupSelect(null)}
                >
                  <Text className={selectedGroup === null ? 'text-white' : 'text-gray-700'}>
                    Custom
                  </Text>
                </TouchableOpacity>
                {fetchedGroups.data.map((group: Group) => (
                  <TouchableOpacity
                    key={group.id}
                    className={`mr-3 py-2 px-4 rounded-lg ${
                      selectedGroup === group.id ? 'bg-primary' : 'bg-gray-100'
                    }`}
                    onPress={() => handleGroupSelect(group.id)}
                  >
                    <Text className={selectedGroup === group.id ? 'text-white' : 'text-gray-700'}>
                      {group.group_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View className="flex-row items-center">
                <Text className="text-gray-500">No groups available</Text>
                <TouchableOpacity onPress={() => fetchGroups()} className="ml-2">
                  <Text className="text-primary">Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View className="p-4 bg-white rounded-lg">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Icon name="address-book" size={20} color="#1E3A8A" />
                <Text className="ml-2 text-lg font-bold text-dark">Selected Contacts</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSelectingContacts(true)}>
                <Text className="font-medium text-secondary">
                  {selectedGroup ? 'Change' : 'Select'}
                </Text>
              </TouchableOpacity>
            </View>
            {selectedContacts.length > 0 ? (
              <View>
                <Text className="mb-3 text-gray-500">
                  {selectedContacts.length} contacts selected
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedContacts.slice(0, 5).map((contact: ExtendedContact) => (
                    <View key={contact.id} className="items-center mr-4">
                      <View className="items-center justify-center w-12 h-12 mb-1 rounded-full bg-primary/10">
                        <Icon name="user" size={24} color="#1E3A8A" />
                      </View>
                      <Text className="text-xs text-dark" numberOfLines={1}>
                        {contact.name}
                      </Text>
                    </View>
                  ))}
                  {selectedContacts.length > 5 && (
                    <View className="items-center">
                      <View className="items-center justify-center w-12 h-12 mb-1 bg-gray-100 rounded-full">
                        <Text className="font-bold">+{selectedContacts.length - 5}</Text>
                      </View>
                      <Text className="text-xs text-dark">More</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            ) : (
              <View className="items-center p-4 rounded-lg bg-gray-50">
                <Icon name="user-plus" size={32} color="#94A3B8" />
                <Text className="mt-2 text-center text-gray-500">
                  No contacts selected. Select a group or add contacts.
                </Text>
                <TouchableOpacity
                  className="px-4 py-2 mt-4 rounded-lg bg-primary"
                  onPress={() => setIsSelectingContacts(true)}
                >
                  <Text className="font-medium text-white">Select Contacts</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View className="p-4 bg-white rounded-lg">
            <View className="flex-row items-center mb-3">
              <Icon name="microphone" size={20} color="#1E3A8A" />
              <Text className="ml-2 text-lg font-bold text-dark">Voice Message</Text>
              {!user?.is_premium && (
                <View className="px-2 py-1 ml-2 rounded bg-secondary/10">
                  <Text className="text-xs text-secondary">Premium</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              className={`bg-gray-50 p-4 rounded-lg flex-row items-center justify-between ${
                isRecording ? 'bg-error/10' : ''
              } ${!user?.is_premium ? 'opacity-50' : ''}`}
              onPress={handleRecordMessage}
              disabled={!user?.is_premium}
            >
              <View className="flex-1">
                <Text className={`${isRecording ? 'text-error' : 'text-gray-700'} font-medium`}>
                  {isRecording
                    ? 'Recording...'
                    : recordedMessage
                    ? 'Re-record Message'
                    : 'Record Voice Message'}
                </Text>
                {!user?.is_premium && (
                  <Text className="mt-1 text-sm text-gray-500">
                    Upgrade to Pro to record voice messages
                  </Text>
                )}
              </View>
              <Icon name="microphone" size={20} color={isRecording ? '#EF4444' : '#64748b'} />
            </TouchableOpacity>
            {recordedMessage && (
              <View className="p-3 mt-4 rounded-lg bg-gray-50">
                <Text className="text-gray-700">{recordedMessage}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            className={`bg-primary rounded-lg py-3 items-center my-4 shadow-lg ${
              selectedContacts.length === 0 ? 'opacity-50' : ''
            }`}
            onPress={handleStartCall}
            disabled={selectedContacts.length === 0}
          >
            <View className="flex-row items-center">
              <Icon name="phone" size={20} color="white" />
              <Text className="ml-2 text-lg font-bold text-white">Start Calling</Text>
            </View>
            {selectedContacts.length > 0 && (
              <Text className="mt-1 text-white/80">
                {selectedContacts.length} contacts selected
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal
        visible={isSelectingContacts}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSelectingContacts(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20 bg-white rounded-t-[32px]">
            <ContactSelector
              onBack={() => setIsSelectingContacts(false)}
              onDone={(contacts: any) => {
                setSelectedContacts(contacts as ExtendedContact[]);
                setIsSelectingContacts(false);
              }}
              initialSelectedContacts={selectedContacts as ExtendedContact[]}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
