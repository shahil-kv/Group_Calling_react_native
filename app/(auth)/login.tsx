import { Link, router } from 'expo-router';
import React from 'react';
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
import { useAuth } from '../../contexts/AuthContext';

// Validation Schema
const schema = yup.object({
  phoneNumber: yup.string().required('Phone number is required'),
  password: yup.string().required('Password is required'),
});

type FormData = yup.InferType<typeof schema>;

const formFields = [
  {
    name: 'phoneNumber',
    label: 'Phone Number',
    type: 'phone' as const,
    placeholder: 'Enter your phone number',
    defaultCode: '+91',
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password' as const,
    placeholder: 'Enter your password',
  },
];

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();

  const onSubmit = async (data: FormData) => {
    try {
      await signIn(data.phoneNumber, data.password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message || 'Invalid phone number or password',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background-primary"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="justify-center flex-1 px-6 py-12">
          <View className="items-center mb-8">
            <View className="items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary">
              <Icon name="phone" size={32} color="#FFFFFF" />
            </View>
            <Text className="text-3xl font-bold text-center text-text-primary">mass caller</Text>
            <Text className="mt-2 text-center text-text-secondary">
              Connect with your groups efficiently
            </Text>
          </View>

          <DynamicForm
            fields={formFields}
            onSubmit={onSubmit}
            validationSchema={schema}
            renderButton={handleSubmit => (
              <Button
                title="Login"
                onPress={handleSubmit}
                fullWidth
                size="lg"
                disabled={isLoading}
                loading={isLoading}
              />
            )}
          />

          <View className="flex-row justify-center mt-6">
            <Text className="text-text-secondary">Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text className="font-medium underline text-secondary">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
