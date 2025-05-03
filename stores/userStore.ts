import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type User = {
    id: string;
    email: string;
    isPro: boolean;
    subscriptionEndDate?: string;
    subscriptionPlan?: 'monthly' | 'yearly';
    features: {
        maxGroups: number;
        maxContactsPerGroup: number;
        canRecordMessages: boolean;
        canScheduleCalls: boolean;
    };
};

type UserStore = {
    user: User | null;
    loading: boolean;
    error: string | null;
    setUser: (user: User | null) => void;
    updateUser: (updates: Partial<User>) => void;
    upgradeToPro: (plan: 'monthly' | 'yearly') => Promise<void>;
    checkSubscription: () => Promise<void>;
    reset: () => void;
};

const DEFAULT_FEATURES = {
    maxGroups: 3,
    maxContactsPerGroup: 10,
    canRecordMessages: false,
    canScheduleCalls: false,
};

const PRO_FEATURES = {
    maxGroups: 50,
    maxContactsPerGroup: 100,
    canRecordMessages: true,
    canScheduleCalls: true,
};

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            user: null,
            loading: false,
            error: null,

            setUser: (user) => {
                set({ user });
            },

            updateUser: (updates) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                }));
            },

            upgradeToPro: async (plan) => {
                set({ loading: true, error: null });
                try {
                    // In a real app, this would call your backend API
                    const subscriptionEndDate = new Date();
                    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + (plan === 'monthly' ? 1 : 12));

                    set((state) => ({
                        user: state.user
                            ? {
                                ...state.user,
                                isPro: true,
                                subscriptionPlan: plan,
                                subscriptionEndDate: subscriptionEndDate.toISOString(),
                                features: PRO_FEATURES,
                            }
                            : null,
                    }));
                } catch (error) {
                    set({ error: 'Failed to upgrade to Pro' });
                    throw error;
                } finally {
                    set({ loading: false });
                }
            },

            checkSubscription: async () => {
                const { user } = get();
                if (!user?.subscriptionEndDate) return;

                const endDate = new Date(user.subscriptionEndDate);
                if (endDate < new Date()) {
                    // Subscription expired
                    set((state) => ({
                        user: state.user
                            ? {
                                ...state.user,
                                isPro: false,
                                subscriptionPlan: undefined,
                                subscriptionEndDate: undefined,
                                features: DEFAULT_FEATURES,
                            }
                            : null,
                    }));
                }
            },

            reset: () => {
                set({
                    user: null,
                    loading: false,
                    error: null,
                });
            },
        }),
        {
            name: 'user-storage',
        }
    )
); 