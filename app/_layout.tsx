import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '../contexts/AuthContext';
import { LoaderProvider } from '../contexts/LoaderContext';
import '../global.css';
configureReanimatedLogger({ strict: false });

declare global {
  var window: {
    frameworkReady?: () => void;
  };
}

// Create a client
const queryClient = new QueryClient();

// Component to handle StatusBar styling
const StatusBarWithTheme = () => {
  const { theme } = useTheme();
  return (
    <StatusBar
      style={theme === 'dark' ? 'light' : 'dark'}
      backgroundColor={theme === 'dark' ? '#1E1E1E' : '#F8FAFC'} // Matches tailwind.config.js
    />
  );
};

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Initialize AsyncStorage
const initializeStorage = async () => {
  try {
    // Clear any existing test data
    await AsyncStorage.removeItem('test');

    // Test write
    await AsyncStorage.setItem('test', 'test');

    // Test read
    const value = await AsyncStorage.getItem('test');

    // Test remove
    await AsyncStorage.removeItem('test');

    if (value !== 'test') {
      throw new Error('Storage verification failed');
    }

    return true;
  } catch (error) {
    console.error('AsyncStorage initialization failed:', error);
    return false;
  }
};

export default function RootLayout() {
  const [isFrameworkReady, setIsFrameworkReady] = useState(false);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    InterRegular: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterBold: Inter_700Bold,
  });

  // Initialize AsyncStorage with retry mechanism
  useEffect(() => {
    const initStorageWithRetry = async (retryCount = 0) => {
      const maxRetries = 3;
      const success = await initializeStorage();

      if (success) {
        setIsStorageReady(true);
      } else if (retryCount < maxRetries) {
        // Wait for 1 second before retrying
        setTimeout(() => {
          initStorageWithRetry(retryCount + 1);
        }, 1000);
      } else {
        // Show error toast after all retries failed
        Toast.show({
          type: 'error',
          text1: 'Storage Error',
          text2: Platform.OS === 'android'
            ? 'Please clear app data and restart the app'
            : 'Failed to initialize app storage. Please restart the app.',
        });
      }
    };

    initStorageWithRetry();
  }, []);

  // Handle framework ready state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.frameworkReady = () => setIsFrameworkReady(true);
    }
  }, []);

  // Hide splash screen once fonts are loaded and storage is ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && isStorageReady) {
      SplashScreen.hideAsync();
      setIsReady(true);
    }
  }, [fontsLoaded, fontError, isStorageReady]);

  // Handle navigation after everything is ready
  useEffect(() => {
    if (isReady && isFrameworkReady) {
      router.replace('/(auth)/signup');
    }
  }, [isReady, isFrameworkReady, router]);

  // Return null to keep splash screen visible while fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <LoaderProvider>
            <AuthProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBarWithTheme />
              <Toast />
            </AuthProvider>
          </LoaderProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
