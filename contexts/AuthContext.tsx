import {
  ApiResponse,
  AuthContextType,
  AuthTokens,
  LoginResponse,
  PremiumStatusResponse,
  RefreshTokenResponse,
  User,
} from "@/types/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { usePost } from "../hooks/useApi";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { mutateAsync: login } = usePost<ApiResponse<LoginResponse>>(
    "/user/login",
    {
      invalidateQueriesOnSuccess: ["users", "auth"],
      showErrorToast: true,
      showSuccessToast: true,
      showLoader: true,
    }
  );

  const { mutateAsync: refreshToken } = usePost<
    ApiResponse<RefreshTokenResponse>
  >("/user/refresh-token", {
    invalidateQueriesOnSuccess: ["users", "auth"],
    showErrorToast: true,
    showSuccessToast: false,
    showLoader: false,
  });

  const { mutateAsync: logout } = usePost<ApiResponse<null>>("/user/logout", {
    invalidateQueriesOnSuccess: ["users", "auth"],
    showErrorToast: true,
    showSuccessToast: true,
    showLoader: true,
  });

  const { mutateAsync: checkPremium } = usePost<
    ApiResponse<PremiumStatusResponse>
  >("/user/premium-status", {
    invalidateQueriesOnSuccess: ["users", "auth"],
    showErrorToast: true,
    showSuccessToast: false,
    showLoader: false,
  });

  const { mutateAsync: upgradePremium } = usePost<
    ApiResponse<PremiumStatusResponse>
  >("/user/upgrade-premium", {
    invalidateQueriesOnSuccess: ["users", "auth"],
    showErrorToast: true,
    showSuccessToast: true,
    showLoader: true,
  });

  useEffect(() => {
    loadStoredAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedTokens = await AsyncStorage.getItem("auth_tokens");
      const storedUser = await AsyncStorage.getItem("auth_user");

      if (storedTokens && storedUser) {
        const parsedTokens = JSON.parse(storedTokens);
        const parsedUser = JSON.parse(storedUser);

        setTokens(parsedTokens);
        setUser(parsedUser);

        // Check if access token is expired
        const tokenData = JSON.parse(
          atob(parsedTokens.accessToken.split(".")[1])
        );
        if (tokenData.exp * 1000 < Date.now()) {
          await refreshAccessToken();
        }
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (phoneNumber: string, password: string) => {
    try {
      const response = await login({ phoneNumber, password });
      const { user, tokens } = response.data;

      await AsyncStorage.setItem("auth_tokens", JSON.stringify(tokens));
      await AsyncStorage.setItem("auth_user", JSON.stringify(user));

      setUser(user);
      setTokens(tokens);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (tokens?.accessToken) {
        await logout({});
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      await AsyncStorage.removeItem("auth_tokens");
      await AsyncStorage.removeItem("auth_user");
      setUser(null);
      setTokens(null);
      router.replace("/(auth)/login");
    }
  };

  const refreshAccessToken = async () => {
    try {
      if (!tokens?.refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await refreshToken({
        refreshToken: tokens.refreshToken,
      });
      const { tokens: newTokens } = response.data;

      await AsyncStorage.setItem("auth_tokens", JSON.stringify(newTokens));
      setTokens(newTokens);
    } catch (error) {
      console.error("Token refresh error:", error);
      await signOut();
      throw error;
    }
  };

  const checkPremiumStatus = async () => {
    try {
      const response = await checkPremium({});
      const { is_premium, premium_expiry } = response.data;

      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          is_premium,
          premium_expiry,
        };
      });
    } catch (error) {
      console.error("Premium status check error:", error);
      throw error;
    }
  };

  const upgradeToPremium = async (plan: "monthly" | "yearly") => {
    try {
      const response = await upgradePremium({ plan });
      const { is_premium, premium_expiry } = response.data;

      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          is_premium,
          premium_expiry,
        };
      });
    } catch (error) {
      console.error("Premium upgrade error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isLoading,
        signIn,
        signOut,
        refreshAccessToken,
        checkPremiumStatus,
        upgradeToPremium,
      }}
    >
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
