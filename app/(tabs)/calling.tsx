import ActiveCallScreen from '@/components/ActiveCallScreen';
import ContactSelector from '@/components/ContactSelector';
import { useAuth } from '@/contexts/AuthContext';
import { CallStatus, useCallStore } from '@/stores/callStore';
import { useContactStore } from '@/stores/contactStore';
import { useGroupStore } from '@/stores/groupStore';
import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';

type ExpoContact = Contacts.Contact;

interface Group {
  id: string;
  name: string;
  contacts: Contacts.Contact[];
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
  const { user } = useAuth();
  const { groups } = useGroupStore();
  const { contacts } = useContactStore();
  const { currentCall, startCall, endCall, moveToNextContact, updateStatus } = useCallStore();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<ExpoContact[]>([]);
  const [isSelectingContacts, setIsSelectingContacts] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedMessage, setRecordedMessage] = useState('');
  const [showTutorial, setShowTutorial] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState('');

  const isCallActive = currentCall.status !== 'idle';
  const currentContact = isCallActive && currentCall.contacts[currentCall.currentIndex];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const requestCallPermissions = async (): Promise<boolean> => {
    return true; // For non-Android platforms
  };

  const confirmSequentialCalls = () => {
    return new Promise(resolve => {
      Alert.alert(
        'Start Sequential Calls',
        `This will automatically call ${selectedContacts.length} contacts in sequence. The app will automatically proceed to the next contact after each call ends. You can stop at any time by pressing "End Call Session".`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Start Calling',
            style: 'default',
            onPress: () => resolve(true),
          },
        ]
      );
    });
  };

  const handleStartCall = async () => {
    try {
      // 1. Validate contact selection
      if (selectedContacts.length === 0) {
        Alert.alert('No Contacts Selected', 'Please select at least one contact to call.');
        return;
      }

      // 2. Check premium limits
      const contactLimit = user?.is_premium ? 500 : 50;
      if (selectedContacts.length > contactLimit) {
        Alert.alert(
          'Contact Limit Exceeded',
          `Free users can call up to 50 contacts. Upgrade to Pro to call up to 500 contacts.`
        );
        return;
      }

      // 3. Request and validate permissions
      console.log('Requesting permissions before starting call...');
      const hasPermission = await requestCallPermissions();
      console.log('Permission result:', hasPermission);

      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please grant call and recording permissions to use this feature.'
        );
        return;
      }

      // 4. Get user confirmation
      const confirmed = await confirmSequentialCalls();
      if (!confirmed) {
        return;
      }

      // 5. Validate and convert contacts
      console.log('Converting contacts...');
      const validContacts = selectedContacts
        .filter(contact => {
          const phoneNumber = contact.phoneNumbers?.[0]?.number;
          const isValid = phoneNumber && phoneNumber.trim().length > 0;
          if (!isValid) {
            console.warn(`Skipping contact ${contact.name}: Invalid phone number`);
          }
          return isValid;
        })
        .map(contact => ({
          id: contact.id || `contact-${Date.now()}-${Math.random()}`,
          name: contact.name || 'Unknown Contact',
          phoneNumber: contact.phoneNumbers?.[0]?.number?.trim() || '',
          email: contact.emails?.[0]?.email,
          photo: contact.imageAvailable && contact.image ? contact.image.uri : undefined,
        }));

      if (validContacts.length === 0) {
        Alert.alert('Invalid Contacts', 'None of the selected contacts have valid phone numbers.');
        return;
      }

      if (validContacts.length < selectedContacts.length) {
        Alert.alert(
          'Some Contacts Skipped',
          `${selectedContacts.length - validContacts.length
          } contacts were skipped because they don't have valid phone numbers.`
        );
      }

      // 6. Start the call
      console.log('Starting call process...');
      const groupName = getGroupName();
      const useRecordedMessage = Boolean(user?.is_premium && recordedMessage);

      console.log('Call parameters:', {
        contactCount: validContacts.length,
        useRecordedMessage,
        groupName,
        isPremium: user?.is_premium,
      });

      try {
        // Start the call with valid contacts
        startCall(validContacts, recordedMessage, useRecordedMessage, groupName);

        // Provide haptic feedback
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Log success
        console.log('Call started successfully');
      } catch (error) {
        console.error('Error starting call:', error);
        Alert.alert(
          'Error Starting Call',
          'There was a problem starting the call. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error in handleStartCall:', error);
      Alert.alert('Error', 'There was a problem starting the call. Please try again.');
    }
  };

  const handleEndCall = async () => {
    try {
      console.log('Ending call...');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      endCall();
      console.log('Call ended successfully');
    } catch (error) {
      console.error('Error ending call:', error);
      Alert.alert('Error', 'There was a problem ending the call. Please try again.');
    }
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
        // Convert our Contact type to ExpoContact type
        const expoContacts: ExpoContact[] = group.contacts.map(contact => ({
          id: contact.id,
          name: contact.name,
          phoneNumbers: [
            { number: contact.phoneNumbers[0].number, type: 'mobile', label: 'mobile' },
          ],
          contactType: 'person',
        }));
        setSelectedContacts(expoContacts);
      }
    } else {
      setSelectedContacts([]);
    }
  };

  const toggleContactSelection = (contact: ExpoContact) => {
    if (selectedContacts.some((c: ExpoContact) => c.id === contact.id)) {
      setSelectedContacts(selectedContacts.filter((c: ExpoContact) => c.id !== contact.id));
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
    if (!user?.is_premium) {
      Alert.alert(
        'Premium Feature',
        'Voice recording is a premium feature. Upgrade to Pro to use this feature.',
        [
          {
            text: 'Upgrade Now',
            onPress: () => {
              // Navigate to upgrade screen
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    setIsRecording(true);
    // Implement actual recording logic here
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
    <SafeAreaView className="flex-1 bg-background-primary" edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Header Section */}
        <View className="px-5 pt-6 pb-4">
          <View className="flex-row items-center mb-1">
            <Icon name="phone" size={24} color="#1E3A8A" />
            <Text className="ml-2 text-2xl font-bold text-text-primary">Start a Call</Text>
          </View>
          <Text className="text-text-secondary ">Call your contacts sequentially</Text>
        </View>

        <ScrollView className="flex-1">
          {/* Tutorial Section */}
          {showTutorial && (
            <View className="p-4 mx-4 mb-6 rounded-xl bg-tertiary">
              <View className="flex-row items-center mb-3">
                <Icon name="info-circle" size={20} color="#1E3A8A" />
                <Text className="ml-2 text-lg font-bold text-primary">How it works</Text>
              </View>
              <View className="gap-3 space-y-2">
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-6 h-6 mr-2 rounded-full bg-primary">
                    <Text className="font-bold text-white">1</Text>
                  </View>
                  <Text className="text-text-secondary">Select contacts or a group</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-6 h-6 mr-2 rounded-full bg-primary">
                    <Text className="font-bold text-white">2</Text>
                  </View>
                  <Text className="text-text-secondary">Record a message (Premium)</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-6 h-6 mr-2 rounded-full bg-primary">
                    <Text className="font-bold text-white">3</Text>
                  </View>
                  <Text className="text-text-secondary">Start calling</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-6 h-6 mr-2 rounded-full bg-primary">
                    <Text className="font-bold text-white">4</Text>
                  </View>
                  <Text className="text-text-secondary">App will automatically call each contact</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-6 h-6 mr-2 rounded-full bg-primary">
                    <Text className="font-bold text-white">5</Text>
                  </View>
                  <Text className="text-text-secondary">Stop anytime with "End Call Session"</Text>
                </View>
              </View>
              <TouchableOpacity className="self-end mt-4" onPress={() => setShowTutorial(false)}>
                <Text className="font-medium text-secondary">Got it</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Main Content */}
          <View className="gap-4 px-4 space-y-4">
            {/* Group Selection */}
            <View className="p-4 rounded-lg shadow-sm bg-tertiary">
              <View className="flex-row items-center mb-3">
                <Icon name="users" size={20} color="#1E3A8A" />
                <Text className="ml-2 text-lg font-bold text-text-primary">Select Group</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                <TouchableOpacity
                  className={`mr-3 py-2 px-4 rounded-lg ${selectedGroup === null ? 'bg-secondary' : 'bg-primary'
                    }`}
                  onPress={() => handleGroupSelect(null)}
                >
                  <Text className={selectedGroup === null ? 'text-white' : 'text-text-secondary'}>
                    Custom
                  </Text>
                </TouchableOpacity>

                {groups.map((group: Group) => (
                  <TouchableOpacity
                    key={group.id}
                    className={`mr-3 py-2 px-4 rounded-lg ${selectedGroup === group.id ? 'bg-secondary' : 'bg-background-primary'
                      }`}
                    onPress={() => handleGroupSelect(group.id)}
                  >
                    <Text className={selectedGroup === group.id ? 'text-white' : 'text-text-secondary'}>
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Contact Selection */}
            <View className="p-4 rounded-lg shadow-sm bg-tertiary">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Icon name="address-book" size={20} color="#1E3A8A" />
                  <Text className="ml-2 text-lg font-bold text-text-primary">Selected Contacts</Text>
                </View>
                <TouchableOpacity onPress={() => setIsSelectingContacts(true)}>
                  <Text className="font-medium text-secondary">
                    {selectedGroup ? 'Change' : 'Select'}
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedContacts.length > 0 ? (
                <View>
                  <Text className="mb-3 text-text-secondary">
                    {selectedContacts.length} contacts selected
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {selectedContacts.slice(0, 5).map((contact: ExpoContact) => (
                      <View key={contact.id} className="items-center mr-4">
                        <View className="items-center justify-center w-12 h-12 mb-1 rounded-full bg-primary">
                          <Icon name="user" size={24} color="#1E3A8A" />
                        </View>
                        <Text className="text-xs text-text-secondary" numberOfLines={1}>
                          {contact.name}
                        </Text>
                      </View>
                    ))}
                    {selectedContacts.length > 5 && (
                      <View className="items-center">
                        <View className="items-center justify-center w-12 h-12 mb-1 rounded-full bg-tertiary">
                          <Text className="font-bold">+{selectedContacts.length - 5}</Text>
                        </View>
                        <Text className="text-xs text-text-secondary">More</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              ) : (
                <View className="items-center p-4 rounded-lg ">
                  <Icon name="user-plus" size={32} color="#94A3B8" />
                  <Text className="mt-2 text-center text-text-primary">
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
            <View className="p-4 rounded-lg shadow-sm bg-tertiary">
              <View className="flex-row items-center mb-3">
                <Icon name="microphone" size={20} color="#1E3A8A" />
                <Text className="ml-2 text-lg font-bold text-text-primary">Voice Message</Text>
                {!user?.is_premium && (
                  <View className="px-2 py-1 ml-2 rounded bg-secondary/10">
                    <Text className="text-sm font-semi-bold text-secondary">Premium</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                className={`bg-background-secondary p-4 rounded-lg flex-row items-center justify-between ${isRecording ? 'bg-error/10' : ''
                  } ${!user?.is_premium ? 'opacity-50' : ''}`}
                onPress={handleRecordMessage}
                disabled={!user?.is_premium}
              >
                <View className="flex-1">
                  <Text className={`${isRecording ? 'text-error' : 'text-text-secondary'} font-medium`}>
                    {isRecording
                      ? 'Recording...'
                      : recordedMessage
                        ? 'Re-record Message'
                        : 'Record Voice Message'}
                  </Text>
                  {!user?.is_premium && (
                    <Text className="mt-1 text-sm text-text-tertiary">
                      Upgrade to Pro to record voice messages
                    </Text>
                  )}
                </View>
                <Icon name="microphone" size={20} color={isRecording ? '#EF4444' : '#64748b'} />
              </TouchableOpacity>

              {recordedMessage && (
                <View className="p-3 mt-4 rounded-lg bg-tertiary">
                  <Text className="text-text-secondary">{recordedMessage}</Text>
                </View>
              )}
            </View>

            {/* Start Calling Button */}
            <TouchableOpacity
              className={`bg-primary rounded-lg py-2 items-center my-2 ${selectedContacts.length === 0 ? 'opacity-50' : ''
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
                visible={isSelectingContacts}
                onClose={() => setIsSelectingContacts(false)}
                onDone={(contacts: any) => {
                  setSelectedContacts(contacts as ExpoContact[]);
                  setIsSelectingContacts(false);
                }}
                initialSelectedContacts={selectedContacts as any}
              />
            </View>
          </View>
        </Modal>
      </Animated.View>
    </SafeAreaView>
  );
}
