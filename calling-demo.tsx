import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface Contact {
  id: string;
  name: string;
  phone_number: string;
}

interface CallHistory {
  id: number;
  contact_phone: string;
  status: string;
  attempt: number;
  called_at: string;
  ended_at?: string;
  duration?: number;
  contacts?: { id: number; name: string };
}

interface CallSession {
  id: number;
  current_index: number;
  status: string;
  contacts: Contact[];
}

interface Props {
  groupId?: number;
  userId: number;
}

const CallingScreen: React.FC<Props> = ({ groupId, userId }) => {
  const router = useRouter();
  const [isCalling, setIsCalling] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [phoneList, setPhoneList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);

  // Fetch group contacts from backend
  const fetchGroupContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `https://your-server.com/get-contacts${groupId ? `?groupId=${groupId}` : ''}`
      );
      if (response.data.statusCode !== 200) {
        throw new Error(response.data.message || 'Failed to fetch contacts');
      }
      const contacts = response.data.data.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        phone_number: c.phone_number,
      }));
      setPhoneList(contacts);
      setSelectedContacts(contacts); // Pre-select all contacts by default
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to fetch contacts. Please try again.');
      Alert.alert('Error', error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Check if agreement is accepted
  useEffect(() => {
    const checkAgreement = async () => {
      const accepted = await AsyncStorage.getItem('callingAgreementAccepted');
      if (!accepted) {
        router.replace('/(tabs)');
      } else {
        fetchGroupContacts();
      }
    };
    checkAgreement();
  }, []);

  // Start calling session
  const startCalling = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('Error', 'No contacts selected to call.');
      return;
    }

    setIsCalling(true);
    setCurrentIndex(0);
    setError(null);

    try {
      const response = await axios.post('https://your-server.com/start-calls', {
        userId,
        groupId,
        contacts: selectedContacts.map(c => ({
          id: c.id,
          name: c.name,
          phoneNumber: c.phone_number,
        })),
        messageContent,
      });
      if (response.data.statusCode !== 200) {
        throw new Error(response.data.message || 'Failed to start calls');
      }
      setSessionId(response.data.data.sessionId);

      // Poll for call status updates
      const interval = setInterval(async () => {
        if (!isCalling) {
          clearInterval(interval);
          return;
        }
        try {
          const historyResponse = await axios.get(
            `https://your-server.com/get-call-history?sessionId=${response.data.data.sessionId}`
          );
          if (historyResponse.data.statusCode === 200) {
            setCallHistory(historyResponse.data.data);
            const sessionResponse = await axios.get(
              `https://your-server.com/get-session?sessionId=${response.data.data.sessionId}`
            );
            const session: CallSession = sessionResponse.data.data;
            if (session.status !== 'in_progress') {
              setIsCalling(false);
              setShowAnalytics(true);
              clearInterval(interval);
            }
            setCurrentIndex(session.current_index);
          }
        } catch (err) {
          console.error('Error polling call status:', err);
        }
      }, 5000);
    } catch (err) {
      console.error('Error starting calls:', err);
      setError('Failed to start calls. Please try again.');
      Alert.alert('Error', error || 'An error occurred');
      setIsCalling(false);
    }
  };

  // Stop calling session
  const stopCalling = async () => {
    if (!sessionId) return;
    try {
      await axios.post('https://your-server.com/stop-session', { sessionId });
      setIsCalling(false);
      setCurrentIndex(0);
      setSessionId(null);
      setShowAnalytics(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Stopped', 'Calling session has been stopped.');
    } catch (err) {
      console.error('Error stopping session:', err);
      Alert.alert('Error', 'Failed to stop session.');
    }
  };

  // Recall unanswered contacts
  const recallUnanswered = async () => {
    const unanswered = callHistory
      .filter(h => h.status === 'no_answer')
      .map(h => ({
        id: h.contacts?.id.toString() || '',
        name: h.contacts?.name || h.contact_phone,
        phone_number: h.contact_phone,
      }));
    if (unanswered.length === 0) {
      Alert.alert('No Unanswered Calls', 'All contacts answered or no calls to recall.');
      return;
    }
    setPhoneList(unanswered);
    setSelectedContacts(unanswered);
    setShowAnalytics(false);
    setCallHistory([]);
    setSessionId(null);
    Alert.alert('Recall Initiated', `Recalling ${unanswered.length} unanswered contacts.`);
  };

  // Select contacts manually
  const toggleContactSelection = (contact: Contact) => {
    Haptics.selectionAsync();
    if (selectedContacts.some(c => c.id === contact.id)) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  // Open message input modal
  const openMessageModal = () => {
    setMessageModalVisible(true);
    Haptics.selectionAsync();
  };

  // Start calling after message input
  const confirmMessageAndStart = () => {
    if (!messageContent) {
      Alert.alert('Error', 'Please enter a message to play during calls.');
      return;
    }
    setMessageModalVisible(false);
    startCalling();
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <Text className="text-2xl font-bold text-center mt-10 mb-5 text-gray-800">Group Calling</Text>

      {/* Loading/Error States */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-3 text-gray-600">Loading contacts...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-red-500 text-center mb-5">{error}</Text>
          <TouchableOpacity
            className="bg-blue-500 px-5 py-3 rounded-lg"
            onPress={fetchGroupContacts}
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : showAnalytics ? (
        /* Analytics Section */
        <ScrollView className="flex-1 px-5">
          <Text className="text-xl font-bold mb-3 text-gray-800">Call Analytics</Text>
          <View className="mb-5 bg-white p-4 rounded-lg shadow-sm">
            <Text className="text-gray-700">Total Calls: {callHistory.length}</Text>
            <Text className="text-gray-700">
              Answered: {callHistory.filter(h => h.status === 'accepted').length}
            </Text>
            <Text className="text-gray-700">
              Not Answered: {callHistory.filter(h => h.status === 'no_answer').length}
            </Text>
            <Text className="text-gray-700">
              Failed: {callHistory.filter(h => h.status === 'failed').length}
            </Text>
          </View>

          {/* Call History List */}
          {callHistory.map(history => (
            <View key={history.id} className="p-3 mb-2 bg-white rounded-lg shadow-sm">
              <Text className="text-gray-800">
                Name: {history.contacts?.name || history.contact_phone}
              </Text>
              <Text className="text-gray-600">Phone: {history.contact_phone}</Text>
              <Text className="text-gray-600">Status: {history.status}</Text>
              <Text className="text-gray-600">Attempt: {history.attempt}</Text>
              <Text className="text-gray-600">
                Duration: {history.duration ? `${history.duration} seconds` : 'N/A'}
              </Text>
              <Text className="text-gray-600">
                Called At:{' '}
                {new Date(history.called_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </Text>
              {history.ended_at && (
                <Text className="text-gray-600">
                  Ended At:{' '}
                  {new Date(history.ended_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </Text>
              )}
            </View>
          ))}

          {/* Recall Unanswered Button */}
          <TouchableOpacity
            className="bg-green-500 px-5 py-3 rounded-lg mt-5 mb-5 flex-row items-center justify-center"
            onPress={recallUnanswered}
          >
            <Icon name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold">Recall Unanswered Contacts</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* Contact Selection and Calling Section */
        <View className="flex-1 px-5">
          {/* Contact List */}
          <Text className="text-lg font-semibold mb-3 text-gray-800">Select Contacts to Call</Text>
          <ScrollView className="flex-1 mb-5">
            {phoneList.map(contact => (
              <TouchableOpacity
                key={contact.id}
                className={`p-3 mb-2 rounded-lg flex-row items-center ${
                  selectedContacts.some(c => c.id === contact.id)
                    ? 'bg-blue-100 border-blue-500'
                    : 'bg-white border-gray-300'
                } border`}
                onPress={() => toggleContactSelection(contact)}
              >
                <Icon
                  name={
                    selectedContacts.some(c => c.id === contact.id) ? 'check-square-o' : 'square-o'
                  }
                  size={20}
                  color={selectedContacts.some(c => c.id === contact.id) ? '#007AFF' : '#666'}
                  style={{ marginRight: 10 }}
                />
                <View>
                  <Text className="text-gray-800">{contact.name}</Text>
                  <Text className="text-gray-600">{contact.phone_number}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Calling Status */}
          {isCalling && (
            <View className="mb-5 p-4 bg-yellow-50 rounded-lg">
              <Text className="text-lg font-semibold text-yellow-800">Calling in Progress...</Text>
              <Text className="text-gray-700">
                Currently calling: {selectedContacts[currentIndex]?.name || 'Unknown'} (
                {selectedContacts[currentIndex]?.phone_number || 'N/A'})
              </Text>
              <Text className="text-gray-700">
                Progress: {currentIndex + 1} / {selectedContacts.length}
              </Text>
            </View>
          )}

          {/* Start/Stop Buttons */}
          <View className="flex-row justify-between mb-10">
            {!isCalling ? (
              <TouchableOpacity
                className="flex-1 bg-blue-500 px-5 py-3 rounded-lg mr-2 flex-row items-center justify-center"
                onPress={openMessageModal}
              >
                <Icon name="phone" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-semibold">Start Calling</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-1 bg-red-500 px-5 py-3 rounded-lg mr-2 flex-row items-center justify-center"
                onPress={stopCalling}
              >
                <Icon name="stop" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-semibold">Stop Calling</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="bg-gray-500 px-5 py-3 rounded-lg flex-row items-center justify-center"
              onPress={() => router.back()}
            >
              <Icon name="arrow-left" size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-semibold">Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Message Input Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={messageModalVisible}
        onRequestClose={() => setMessageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View className="bg-white p-5 rounded-lg w-11/12">
            <Text className="text-lg font-semibold mb-3 text-gray-800">Enter Message to Play</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-5 text-gray-800"
              placeholder="Enter the message to be played during calls"
              value={messageContent}
              onChangeText={setMessageContent}
              multiline
            />
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="bg-gray-500 px-5 py-3 rounded-lg flex-row items-center"
                onPress={() => setMessageModalVisible(false)}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-blue-500 px-5 py-3 rounded-lg flex-row items-center"
                onPress={confirmMessageAndStart}
              >
                <Text className="text-white font-semibold">Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default CallingScreen;
