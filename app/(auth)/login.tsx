import { Link } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
// import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  //   const { signIn, loading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    // try {
    //   setError('');
    //   await signIn(email, password);
    // } catch (err) {
    //   setError('Login failed. Please check your credentials.');
    // }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="justify-center flex-1 px-6 py-12">
          <View className="items-center mb-8">
            <View className="items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary">
              <Icon name="phone" size={32} color="#FFFFFF" />
            </View>
            <Text className="text-3xl font-bold text-center text-dark">
              SequentiCall
            </Text>
            <Text className="mt-2 text-center text-gray-500">
              Connect with your groups efficiently
            </Text>
          </View>

          <View className="mb-6 space-y-4">
            <View>
              <Text className="mb-1 font-medium text-gray-700">Email</Text>
              <TextInput
                className="px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-secondary"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text className="mb-1 font-medium text-gray-700">Password</Text>
              <TextInput
                className="px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-secondary"
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error ? (
              <Text className="text-center text-error">{error}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            className="items-center py-4 rounded-lg bg-primary "
            onPress={handleLogin}
          >
            <Text className="text-lg font-bold text-white">Login</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">Dont have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text className="font-medium text-secondary">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <View className="flex-row justify-center mt-2">
            <Text className="text-gray-600">Go to Home? </Text>
            <Link href="/(tabs)" asChild>
              <TouchableOpacity>
                <Text className="font-medium text-secondary">Home</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
