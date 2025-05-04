import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AUTH_CONFIG,
  ApiResponse,
  PremiumStatusResponse,
  User,
} from "../config/auth.config";
import { usePost } from "../hooks/useApi";

interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface RefreshTokenResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user?: User;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (phoneNumber: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkPremiumStatus: () => Promise<void>;
  upgradeToPremium: (plan: "monthly" | "yearly") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
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
    showErrorToast: false,
    showSuccessToast: false,
    showLoader: false,
  });

  const { mutateAsync: logout } = usePost<ApiResponse<null>>("user/logout", {
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

  const loadStoredAuth = useCallback(async () => {
    try {
      // First check if we have stored tokens
      const storedRefreshToken = await AsyncStorage.getItem("refresh_token");
      console.log(
        "Checking auth state, refresh token:",
        storedRefreshToken ? "exists" : "not found"
      );

      if (!storedRefreshToken) {
        console.log("No refresh token, clearing user and redirecting to login");
        setUser(null);
        // Force navigation to login regardless of current route
        router.replace(AUTH_CONFIG.ROUTES.LOGIN);
        return;
      }

      try {
        console.log("Attempting to refresh token");
        const response = await refreshToken({
          refreshToken: storedRefreshToken,
        });
        const { tokens } = response.data;

        // Store new tokens
        await AsyncStorage.setItem("access_token", tokens.accessToken);
        await AsyncStorage.setItem("refresh_token", tokens.refreshToken);

        // Get user data from the response if available, or keep existing user
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
        // Clear everything and force login
        setUser(null);
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
        router.replace(AUTH_CONFIG.ROUTES.LOGIN);
      }
    } catch (error: any) {
      console.error("Auth check failed:", error);
      // Clear everything and force login
      setUser(null);
      await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
      router.replace(AUTH_CONFIG.ROUTES.LOGIN);
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken]);

  const signIn = async (phoneNumber: string, password: string) => {
    try {
      const response = await login({ phoneNumber, password });

      const { user, tokens } = response.data;

      // Store both tokens
      await AsyncStorage.setItem("access_token", tokens.accessToken);
      await AsyncStorage.setItem("refresh_token", tokens.refreshToken);

      setUser(user);
      router.replace(AUTH_CONFIG.ROUTES.TABS);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // First try to call logout API
      await logout({});
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      try {
        // Clear all stored data
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);

        // Clear user state
        setUser(null);

        // Force navigation to login
        router.replace(AUTH_CONFIG.ROUTES.LOGIN);
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
        // Even if cleanup fails, try to redirect to login
        router.replace(AUTH_CONFIG.ROUTES.LOGIN);
      }
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

  // Only check auth on initial load
  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
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
