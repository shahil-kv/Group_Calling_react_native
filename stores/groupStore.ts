import { create } from 'zustand';
import { Contact } from './contactStore';

export type Group = {
  id: string;
  name: string;
  description?: string;
  contacts: Contact[];
  createdAt: string;
};

type GroupStore = {
  groups: Group[];
  selectedGroup: Group | null;
  setSelectedGroup: (group: Group | null) => void;
  addGroup: (name: string, description?: string, contacts?: Contact[]) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  addContactToGroup: (groupId: string, contact: Contact) => void;
  removeContactFromGroup: (groupId: string, contactId: string) => void;
};

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  selectedGroup: null,
  
  setSelectedGroup: (group) => {
    set({ selectedGroup: group });
  },
  
  addGroup: (name, description, contacts = []) => {
    const newGroup: Group = {
      id: Date.now().toString(),
      name,
      description,
      contacts: contacts || [],
      createdAt: new Date().toISOString(),
    };
    
    set((state) => ({
      groups: [...state.groups, newGroup],
    }));
  },
  
  updateGroup: (id, updates) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === id ? { ...group, ...updates } : group
      ),
    }));
  },
  
  deleteGroup: (id) => {
    set((state) => ({
      groups: state.groups.filter((group) => group.id !== id),
      selectedGroup: state.selectedGroup?.id === id ? null : state.selectedGroup,
    }));
  },
  
  addContactToGroup: (groupId, contact) => {
    set((state) => ({
      groups: state.groups.map((group) => {
        if (group.id === groupId) {
          // Check if contact already exists in the group
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
  },
}));