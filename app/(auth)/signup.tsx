// SignupScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as yup from 'yup';
import Button from '../../components/Button';
import { DynamicForm } from '../../components/DynamicForm';
import CustomOTPInput from '../../components/OTPInput';
import { usePost } from '../../hooks/useApi';

// Validation Schema
const schema = yup.object({
  fullName: yup
    .string()
    .max(20, 'Full name cannot exceed 10 characters')
    .required('Full name is required'),
  gmail: yup.string().email('Invalid email address').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  password: yup
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(10, 'Password cannot exceed 10 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

type FormData = yup.InferType<typeof schema>;

export type { FormData };

const formFields = [
  {
    name: 'fullName',
    label: 'Full Name',
    type: 'text' as const,
    placeholder: 'Enter your full name',
    maxLength: 20,
  },
  {
    name: 'gmail',
    label: 'Gmail',
    type: 'email' as const,
    placeholder: 'Enter your gmail',
  },
  {
    name: 'phoneNumber',
    label: 'Phone Number',
    type: 'phone' as const,
    placeholder: 'Enter your phone number',
    defaultCode: 'IN',
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password' as const,
    placeholder: 'Create password',
    maxLength: 10,
  },
  {
    name: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password' as const,
    placeholder: 'Confirm password',
    maxLength: 10,
  },
];

export default function SignupScreen() {
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isStorageReady, setIsStorageReady] = useState(false);

  // Check AsyncStorage readiness
  useEffect(() => {
    const checkStorage = async () => {
      try {
        await AsyncStorage.setItem('test', 'test');
        const value = await AsyncStorage.getItem('test');
        await AsyncStorage.removeItem('test');
        if (value === 'test') {
          setIsStorageReady(true);
        }
      } catch (error) {
        console.error('Storage check failed:', error);
        Toast.show({
          type: 'error',
          text1: 'Storage Error',
          text2: 'Please restart the app',
        });
      }
    };
    checkStorage();
  }, []);

  const { mutateAsync: signup } = usePost('/user/register', {
    invalidateQueriesOnSuccess: ['users', 'auth'],
    showErrorToast: true,
    showSuccessToast: true,
    showLoader: true,
  });

  const { mutateAsync: verifyOTP } = usePost('/user/verify-phone', {
    invalidateQueriesOnSuccess: ['users', 'auth'],
    showErrorToast: true,
    showSuccessToast: true,
  });

  const onSubmit = async (data: FormData) => {
    if (!isStorageReady) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please wait while we initialize the app',
      });
      return;
    }

    try {
      const payload = {
        ...data,
        opsMode: 'INSERT',
        role: 'USER',
      };
      const result = await signup(payload);

      setPhoneNumber(data.phoneNumber);
      setShowOTP(true);
    } catch (error) {
      console.error('Signup process error:', error);
      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: 'Please try again',
      });
    }
  };

  const handleOTPSubmit = async () => {
    if (!isStorageReady) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please wait while we initialize the app',
      });
      return;
    }

    try {
      const phoneNumberCleaned = phoneNumber.replace(/\s+/g, '');
      await verifyOTP({
        phoneNumber: phoneNumberCleaned,
        otp,
      });
      router.navigate('/(auth)/login');
    } catch (error) {
      console.error('OTP verification error:', error);
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: 'Please try again',
      });
    }
  };

  if (!isStorageReady) {
    return (
      <View className="items-center justify-center flex-1 bg-background-primary">
        <Text className="text-lg text-text-primary">Initializing app...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background-primary"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="justify-center flex-1 px-6 py-12">
          <View className="items-center mb-8">
            <View className="items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary">
              <Icon name="phone" size={30} color="#fff" />
            </View>
            <Text className="text-3xl font-bold text-center text-text-primary">mass caller</Text>
            <Text className="mt-2 text-center text-text-secondary">
              {showOTP ? 'Verify your phone number' : 'Create your account'}
            </Text>
          </View>

          {!showOTP ? (
            <DynamicForm
              fields={formFields}
              onSubmit={onSubmit}
              validationSchema={schema}
              renderButton={handleSubmit => (
                <Button title="Sign Up" onPress={handleSubmit} fullWidth size="lg" />
              )}
            />
          ) : (
            <View className="space-y-4">
              <CustomOTPInput value={otp} onChange={setOtp} label="Enter OTP" />
              <Button title="Verify OTP" onPress={handleOTPSubmit} fullWidth size="lg" />
            </View>
          )}

          {!showOTP && (
            <View className="flex-row justify-center mt-6">
              <Text className="text-text-secondary">Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="font-medium underline text-secondary">Log In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}

          <View className="px-2 mt-4">
            <Text className="text-xs text-center text-gray-500">
              By signing up, you agree to our{' '}
              <Text className="underline text-secondary">Terms of Service</Text> and{' '}
              <Text className="underline text-secondary">Privacy Policy</Text>, including consent
              for automated calls.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
