import { Contact, Group } from '@/types/contact.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type OfflineChange = {
  type: 'ADD' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
};

type GroupStore = {
  groups: Group[];
  selectedGroup: Group | null;
  isOffline: boolean;
  offlineChanges: OfflineChange[];
  setSelectedGroup: (group: Group | null) => void;
  addGroup: (name: string, description?: string, contacts?: Contact[]) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  addContactToGroup: (groupId: string, contact: Contact) => void;
  removeContactFromGroup: (groupId: string, contactId: string) => void;
  setGroups: (groups: Group[]) => void;
  setOfflineMode: (isOffline: boolean) => void;
  addOfflineChange: (change: OfflineChange) => void;
  clearOfflineChanges: () => void;
};

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      groups: [],
      selectedGroup: null,
      isOffline: false,
      offlineChanges: [],

      setSelectedGroup: (group) => {
        set({ selectedGroup: group });
      },

      setGroups: (groups) => {
        set({ groups });
      },

      setOfflineMode: (isOffline) => {
        set({ isOffline });
      },

      addOfflineChange: (change) => {
        set((state) => ({
          offlineChanges: [...state.offlineChanges, change],
        }));
      },

      clearOfflineChanges: () => {
        set({ offlineChanges: [] });
      },

      addGroup: (name, description = '', contacts = []) => {
        const newGroup: Group = {
          id: Date.now().toString(),
          name,
          description,
          contacts,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          groups: [...state.groups, newGroup],
        }));

        // Track offline change
        if (get().isOffline) {
          get().addOfflineChange({
            type: 'ADD',
            data: newGroup,
            timestamp: Date.now(),
          });
        }
      },

      updateGroup: (id, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, ...updates } : group
          ),
        }));

        // Track offline change
        if (get().isOffline) {
          get().addOfflineChange({
            type: 'UPDATE',
            data: { id, updates },
            timestamp: Date.now(),
          });
        }
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          selectedGroup: state.selectedGroup?.id === id ? null : state.selectedGroup,
        }));

        // Track offline change
        if (get().isOffline) {
          get().addOfflineChange({
            type: 'DELETE',
            data: { id },
            timestamp: Date.now(),
          });
        }
      },

      addContactToGroup: (groupId, contact) => {
        set((state) => ({
          groups: state.groups.map((group) => {
            if (group.id === groupId) {
              const contactExists = group.contacts.some((c) => c.id === contact.id);
              if (!contactExists) {
                return {
                  ...group,
                  contacts: [...group.contacts, contact],
                };
              }
            }
            return group;
          }),
        }));

        // Track offline change
        if (get().isOffline) {
          get().addOfflineChange({
            type: 'UPDATE',
            data: {
              id: groupId,
              updates: {
                contacts: [...get().groups.find(g => g.id === groupId)?.contacts || [], contact]
              }
            },
            timestamp: Date.now(),
          });
        }
      },

      removeContactFromGroup: (groupId, contactId) => {
        set((state) => ({
          groups: state.groups.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                contacts: group.contacts.filter((contact) => contact.id !== contactId),
              };
            }
            return group;
          }),
        }));

        // Track offline change
        if (get().isOffline) {
          get().addOfflineChange({
            type: 'UPDATE',
            data: {
              id: groupId,
              updates: {
                contacts: get().groups.find(g => g.id === groupId)?.contacts.filter(c => c.id !== contactId) || []
              }
            },
            timestamp: Date.now(),
          });
        }
      },
    }),
    {
      name: 'group-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);