import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import React, { useEffect } from 'react';
import {
  Animated,
  NativeEventEmitter,
  NativeModules,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { CallStatus, useCallStore } from '../stores/callStore';
import { Contact } from '../stores/contactStore';

// Fallback to Linking if native module is not available
const CallModule = NativeModules.CallModule || {
  makeCall: (phoneNumber: string) => Linking.openURL(`tel:${phoneNumber}`),
  endCall: () => Promise.resolve(true),
};

interface ActiveCallScreenProps {
  currentContact: Contact;
  onEndCall: () => void;
}

export default function ActiveCallScreen({ currentContact, onEndCall }: ActiveCallScreenProps) {
  const { currentCall, moveToNextContact, updateStatus } = useCallStore();
  const [pulseAnim] = React.useState(new Animated.Value(1));

  useEffect(() => {
    if (currentCall.status === 'calling') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [currentCall.status]);

  useEffect(() => {
    if (currentCall.status === 'calling' && currentContact) {
      // Use native module to make the call
      CallModule.makeCall(currentContact.phoneNumber)
        .then(() => {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        })
        .catch((error: Error) => {
          console.error('Failed to initiate call:', error);
          updateStatus('failed');
        });
    }
  }, [currentCall.status, currentCall.currentIndex]);

  // Listen for call state changes
  useEffect(() => {
    if (Platform.OS === 'android') {
      const eventEmitter = new NativeEventEmitter(CallModule);
      const subscription = eventEmitter.addListener('callStateChanged', event => {
        switch (event.state) {
          case 'connected':
            updateStatus('connected');
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            break;
          case 'idle':
            // Call ended, move to next contact
            const moveSuccess = moveToNextContact();
            if (!moveSuccess) {
              updateStatus('completed');
            }
            break;
          case 'ringing':
            // Call is ringing, update status if needed
            break;
        }
      });

      return () => {
        subscription.remove();
      };
    }
  }, []);

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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-6">
        <View className="items-center justify-center flex-1">
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
            }}
            className="items-center justify-center w-24 h-24 mb-6 rounded-full bg-primary/10"
          >
            <Icon name="user" size={48} color="#1E3A8A" />
          </Animated.View>

          <Text className="mb-2 text-2xl font-bold text-center">{currentContact.name}</Text>
          <Text className="mb-6 text-lg text-center text-gray-500">
            {currentContact.phoneNumber}
          </Text>

          <View className={`${getCallStatusColor(currentCall.status)} px-4 py-2 rounded-full mb-8`}>
            <Text className="font-medium text-white">{getCallStatusText(currentCall.status)}</Text>
          </View>

          {currentCall.status === 'connected' && currentCall.message && (
            <View className="w-full p-4 mb-8 bg-white rounded-lg">
              <Text className="mb-2 text-center text-gray-500">Playing message:</Text>
              <Text className="text-center text-dark">{currentCall.message}</Text>
            </View>
          )}

          <View className="w-full p-4 mb-8 bg-white rounded-lg">
            <Text className="mb-2 text-center text-gray-500">Call Progress</Text>
            <View className="w-full h-2 mb-2 bg-gray-200 rounded-full">
              <View
                className="h-2 rounded-full bg-primary"
                style={{
                  width: `${(currentCall.currentIndex / currentCall.contacts.length) * 100}%`,
                }}
              />
            </View>
            <Text className="text-center text-gray-500">
              {currentCall.currentIndex + 1} of {currentCall.contacts.length} contacts
            </Text>
            <Text className="mt-2 text-center text-dark">
              Currently calling: {currentContact.name}
            </Text>
          </View>

          <TouchableOpacity className="w-full py-4 rounded-lg bg-error" onPress={onEndCall}>
            <Text className="text-lg font-bold text-center text-white">End Call Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
