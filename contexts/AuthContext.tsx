import { useUserStore } from "@/stores/userStore";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const { setUser, reset: resetUser } = useUserStore();

  useEffect(() => {
    // Check for existing session
    const loadUser = async () => {
      try {
        const userString = await SecureStore.getItemAsync("user");
        if (userString) {
          const user = JSON.parse(userString);
          setUser(user);
          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)/login");
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      // In a real app, this would validate credentials with your auth provider
      const user = {
        id: "123",
        email,
        isPro: false,
        features: {
          maxGroups: 3,
          maxContactsPerGroup: 10,
          canRecordMessages: false,
          canScheduleCalls: false,
        },
      };

      await SecureStore.setItemAsync("user", JSON.stringify(user));
      setUser(user);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      // In a real app, this would create a new user in your auth provider
      const user = {
        id: "123",
        email,
        isPro: false,
        features: {
          maxGroups: 3,
          maxContactsPerGroup: 10,
          canRecordMessages: false,
          canScheduleCalls: false,
        },
      };

      await SecureStore.setItemAsync("user", JSON.stringify(user));
      setUser(user);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await SecureStore.deleteItemAsync("user");
      resetUser();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
