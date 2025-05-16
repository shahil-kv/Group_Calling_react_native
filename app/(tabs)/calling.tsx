import ActiveCallScreen from '@/components/ActiveCallScreen';
import ContactSelector from '@/components/ContactSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useGet, usePost } from '@/hooks/useApi';
import { ExtendedContact } from '@/types/contact.types';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

// Define the contact structure as per the API response
interface ApiContact {
  id: number;
  group_id: number;
  contact_id: string | null;
  name: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string;
  country_code: string | null;
  raw_contact: any;
  created_at: string;
  updated_at: string;
  is_contact_from_device: boolean;
}

interface Group {
  id: string; // Changed from group_id to match API response
  name: string;
  contacts: ApiContact[];
  group_type: 'MANUAL' | 'USER_DEFINED';
  group_name: string;
}

interface CallState {
  status: 'idle' | 'in_progress' | 'completed' | 'stopped';
  contacts: Array<{ id: string; name: string; phoneNumber: string }>;
  currentIndex: number;
  sessionId: number | null;
}

type CallStatus = 'idle' | 'in_progress' | 'completed' | 'stopped';

export default function CallingScreen() {
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<ExtendedContact[]>([]);
  const [isSelectingContacts, setIsSelectingContacts] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedMessage, setRecordedMessage] = useState('');
  const [showTutorial, setShowTutorial] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [currentCall, setCurrentCall] = useState<CallState>({
    status: 'idle',
    contacts: [],
    currentIndex: 0,
    sessionId: null,
  });
  const stableUserId = useMemo(() => (user?.id != null ? String(user.id) : undefined), [user?.id]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);

  const API_URL = 'https://6811-103-165-167-98.ngrok-free.app';
  const isCallActive = currentCall.status !== 'idle';
  const currentContact = isCallActive && currentCall.contacts[currentCall.currentIndex];

  // Fetch groups using useGet
  const {
    data: fetchedGroups,
    refetch: fetchGroups,
    isFetching: isFetchingGroups,
  } = useGet<any, { userId: string | undefined }>(
    '/group/get-groups',
    { userId: stableUserId },
    {
      showErrorToast: true,
      showSuccessToast: false,
      showLoader: false,
    }
  );

  // API hooks
  const { mutateAsync: StartCallSession } = usePost('/call/call_list', {
    invalidateQueriesOnSuccess: ['/group/get-groups'],
    showErrorToast: true,
    showSuccessToast: true,
    showLoader: true,
  });

  // Filter out MANUAL groups when fetchedGroups changes
  useEffect(() => {
    if (fetchedGroups?.data && Array.isArray(fetchedGroups.data)) {
      const nonManualGroups = fetchedGroups.data
        .filter((group: any) => group.group_type !== 'MANUAL')
        .map((group: any) => ({
          ...group,
          id: String(group.id), // Use group.id instead of group.group_id
          name: group.group_name,
        }));
      setFilteredGroups(nonManualGroups);
    } else {
      setFilteredGroups([]);
    }
  }, [fetchedGroups]);

  // Initialize Socket.IO connection with proper typing
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    const socketInstance: Socket = io(API_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Socket.IO connected');
    });

    socketInstance.on('connect_error', error => {
      console.error('Socket.IO connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Listen for call status updates via Socket.IO with typed data
  useEffect(() => {
    if (!socket || !currentCall.sessionId) return;

    socket.on(
      'callStatusUpdate',
      (data: {
        sessionId: number;
        status: CallStatus;
        currentIndex: number;
        totalCalls: number;
      }) => {
        if (data.sessionId !== currentCall.sessionId) return;

        const { status, currentIndex, totalCalls } = data;
        setCurrentCall(prev => ({
          ...prev,
          status,
          currentIndex: currentIndex || prev.currentIndex,
        }));

        if (currentIndex >= totalCalls - 1 || status === 'completed' || status === 'stopped') {
          setCurrentCall(prev => ({
            ...prev,
            status: 'completed',
          }));
        }
      }
    );

    return () => {
      socket.off('callStatusUpdate');
    };
  }, [socket, currentCall.sessionId]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const confirmSequentialCalls = () => {
    return new Promise(resolve => {
      Alert.alert(
        'Start Sequential Calls',
        `This will automatically call ${selectedContacts.length} contacts in sequence. The app will automatically proceed to the next contact after each call ends. You can stop at any time by pressing "End Call Session".`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Start Calling', style: 'default', onPress: () => resolve(true) },
        ]
      );
    });
  };

  const handleStartCall = async () => {
    try {
      if (selectedContacts.length === 0) {
        Alert.alert('No Contacts Selected', 'Please select at least one contact to call.');
        return;
      }

      const contactLimit = user?.is_premium ? 500 : 50;
      if (selectedContacts.length > contactLimit) {
        Alert.alert(
          'Contact Limit Exceeded',
          `Free users can call up to 50 contacts. Upgrade to Pro to call up to 500 contacts.`
        );
        return;
      }

      const confirmed = await confirmSequentialCalls();
      if (!confirmed) return;

      const validContacts = selectedContacts
        .filter(contact => {
          const phoneNumber = contact.phoneNumbers?.[0]?.number;
          return phoneNumber && phoneNumber.trim().length > 0;
        })
        .map(contact => ({
          id: contact.id || `contact-${Date.now()}-${Math.random()}`,
          name: contact.name || 'Unknown Contact',
          phoneNumber: contact.phoneNumbers?.[0]?.number?.trim() || '',
        }));

      if (validContacts.length === 0) {
        Alert.alert('Invalid Contacts', 'None of the selected contacts have valid phone numbers.');
        return;
      }

      const useRecordedMessage = Boolean(user?.is_premium && recordedMessage);
      const defaultMessage = 'Hello, this is an automated call from the app. Thank you!';
      const messageContent = useRecordedMessage ? recordedMessage : defaultMessage;

      let payload;
      if (selectedGroup === null) {
        payload = {
          userId: Number(user?.id),
          contacts: validContacts.map(contact => ({
            name: contact.name,
            phoneNumber: contact.phoneNumber,
          })),
          groupId: 0,
          groupType: 'MANUAL',
          messageContent,
        };
      } else {
        payload = {
          userId: Number(user?.id),
          groupId: Number(selectedGroup),
          groupType: 'USER_DEFINED',
          messageContent,
        };
      }

      console.log(payload);

      const response: any = await StartCallSession(payload);
      if (response.statusCode !== 200) {
        throw new Error(response.message || 'Failed to start call');
      }

      setCurrentCall({
        status: 'in_progress',
        contacts: validContacts,
        currentIndex: 0,
        sessionId: response.data.sessionId,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'There was a problem starting the call. Please try again.'
      );
    }
  };

  const handleEndCall = async () => {
    try {
      if (!currentCall.sessionId) return;

      const response = await fetch(`${API_URL}/api/v1/call/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentCall.sessionId }),
      });

      const data = await response.json();
      if (data.statusCode !== 200) {
        throw new Error(data.message || 'Failed to stop call session');
      }

      setCurrentCall({ status: 'idle', contacts: [], currentIndex: 0, sessionId: null });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'There was a problem ending the call. Please try again.'
      );
    }
  };

  const handleGroupSelect = (groupId: string | null) => {
    setSelectedGroup(groupId);
    if (groupId) {
      const group = filteredGroups.find((g: Group) => g.id === groupId);
      if (group) {
        const expoContacts: ExtendedContact[] = group.contacts
          .filter(contact => contact.phone_number && contact.phone_number.trim().length > 0)
          .map((contact: ApiContact) => ({
            id: contact.contact_id || String(contact.id),
            name: contact.name || 'Unknown Contact',
            phoneNumbers: [
              {
                number: contact.phone_number,
                type: 'mobile',
                label: 'mobile',
              },
            ],
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
      Alert.alert(
        'Premium Feature',
        'Voice recording is a premium feature. Upgrade to Pro to use this feature.',
        [
          { text: 'Upgrade Now', onPress: () => console.log('upgrade') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setRecordedMessage('This is a pre-recorded message. Thank you for your attention!');
      Alert.alert('Message Recorded', 'Your message has been recorded successfully.');
    }, 2000);
  };

  if (isCallActive && currentContact) {
    return <ActiveCallScreen currentContact={currentContact} onEndCall={handleEndCall} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-50 to-white" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Header Section */}
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
          {/* Tutorial Section */}
          {showTutorial && (
            <View className="p-4 mx-4 mb-6 rounded-lg bg-primary/10 shadow-sm">
              <View className="flex-row items-center mb-3">
                <Icon name="info-circle" size={20} color="#1E3A8A" />
                <Text className="ml-2 text-lg font-bold text-primary">How it works</Text>
              </View>
              <View className="gap-3 space-y-2">
                {[
                  'Select contacts or a group',
                  'Record a message (Premium)',
                  'Start calling',
                  'App will automatically call each contact',
                  'Stop anytime with "End Call Session"',
                ].map((step, index) => (
                  <View key={index} className="flex-row items-center">
                    <View className="items-center justify-center w-6 h-6 mr-2 rounded-full bg-primary">
                      <Text className="font-bold text-white">{index + 1}</Text>
                    </View>
                    <Text className="text-gray-700">{step}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity className="self-end mt-4" onPress={() => setShowTutorial(false)}>
                <Text className="font-medium text-primary">Got it</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Main Content */}
          <View className="gap-4 px-4 space-y-4">
            {/* Group Selection */}
            <View className="p-4 bg-white rounded-lg shadow-md">
              <View className="flex-row items-center mb-3">
                <Icon name="users" size={20} color="#1E3A8A" />
                <Text className="ml-2 text-lg font-bold text-dark">Select Group</Text>
              </View>
              {isFetchingGroups ? (
                <Text className="text-gray-500">Loading groups...</Text>
              ) : filteredGroups.length > 0 ? (
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
                  {filteredGroups.map((group: Group) => (
                    <TouchableOpacity
                      key={group.id}
                      className={`mr-3 py-2 px-4 rounded-lg ${
                        selectedGroup === group.id ? 'bg-primary' : 'bg-gray-100'
                      }`}
                      onPress={() => handleGroupSelect(group.id)}
                    >
                      <Text className={selectedGroup === group.id ? 'text-white' : 'text-gray-700'}>
                        {group.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View className="flex-row items-center">
                  <Text className="text-gray-500">No user-defined groups available</Text>
                  <TouchableOpacity onPress={() => fetchGroups()} className="ml-2">
                    <Text className="text-primary">Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Contact Selection */}
            <View className="p-4 bg-white rounded-lg shadow-md">
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
                    No contacts selected. Select a group or add contacts individually.
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

            {/* Voice Message */}
            <View className="p-4 bg-white rounded-lg shadow-md">
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

            {/* Start Calling Button */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
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
            </Animated.View>
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
      </Animated.View>
    </SafeAreaView>
  );
}
