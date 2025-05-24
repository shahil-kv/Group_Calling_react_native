import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
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
  const backgroundColor = theme === 'dark' ? '#0F172A' : '#F8FAFC';

  return (
    <>
      {/* View to render under the status bar for background color */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: Constants.statusBarHeight,
          backgroundColor: backgroundColor,
          zIndex: 1,
        }}
      />
      {/* Status bar with transparent background */}
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} translucent={true} />
    </>
  );
};

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Initialize SecureStore
const initializeStorage = async () => {
  try {
    // Test write
    await SecureStore.setItemAsync('test', 'test');

    // Test read
    const value = await SecureStore.getItemAsync('test');

    // Test remove
    await SecureStore.deleteItemAsync('test');

    if (value !== 'test') {
      throw new Error('Storage verification failed');
    }

    console.log('SecureStore initialized successfully');
    return true;
  } catch (error) {
    console.error('SecureStore initialization failed:', error);
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

  // Initialize SecureStore with retry mechanism
  useEffect(() => {
    const initStorageWithRetry = async (retryCount = 0) => {
      const maxRetries = 3;
      const success = await initializeStorage();

      if (success) {
        setIsStorageReady(true);
      } else if (retryCount < maxRetries) {
        console.log(
          `Retrying SecureStore initialization (attempt ${retryCount + 1}/${maxRetries})`
        );
        setTimeout(() => {
          initStorageWithRetry(retryCount + 1);
        }, 1000);
      } else {
        // Show error toast after all retries failed
        Toast.show({
          type: 'error',
          text1: 'Storage Error',
          text2:
            Platform.OS === 'android'
              ? 'Please clear app data and restart the app'
              : 'Failed to initialize app storage. Please restart the app.',
        });
        // Proceed even if storage initialization fails to avoid being stuck
        setIsStorageReady(true);
      }
    };

    initStorageWithRetry();
  }, []);

  // Handle framework ready state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.frameworkReady = () => {
        console.log('Framework ready');
        setIsFrameworkReady(true);
      };
    }
  }, []);

  // Hide splash screen once fonts are loaded and storage is ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && isStorageReady) {
      console.log(
        'Hiding splash screen: fontsLoaded=',
        fontsLoaded,
        'fontError=',
        fontError,
        'isStorageReady=',
        isStorageReady
      );
      SplashScreen.hideAsync();
      setIsReady(true);
    }
  }, [fontsLoaded, fontError, isStorageReady]);

  // Debug font loading issues
  useEffect(() => {
    if (!fontsLoaded && !fontError) {
      console.log('Fonts still loading...');
    } else if (fontError) {
      console.error('Font loading error:', fontError);
    } else {
      console.log('Fonts loaded successfully');
    }
  }, [fontsLoaded, fontError]);

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
              <StatusBarWithTheme />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
                {/* Additional screens outside the tab layout */}
                <Stack.Screen name="sessions/[groupId]" options={{ headerShown: false }} />
              </Stack>
              <Toast />
            </AuthProvider>
          </LoaderProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
