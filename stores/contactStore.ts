import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';
import { create } from 'zustand';

export type Contact = {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  photo?: string;
};

type ContactStore = {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  hasPermission: boolean | null;
  addContact: (contact: Contact) => void;
  editContact: (id: string, updatedContact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  importContacts: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
};

export const useContactStore = create<ContactStore>((set, get) => ({
  contacts: [],
  loading: false,
  error: null,
  hasPermission: null,

  addContact: (contact) => {
    set((state) => ({
      contacts: [...state.contacts, contact],
    }));
  },

  editContact: (id, updatedContact) => {
    set((state) => ({
      contacts: state.contacts.map((contact) =>
        contact.id === id ? { ...contact, ...updatedContact } : contact
      ),
    }));
  },

  deleteContact: (id) => {
    set((state) => ({
      contacts: state.contacts.filter((contact) => contact.id !== id),
    }));
  },

  requestPermission: async () => {
    set({ loading: true, error: null });
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      const hasPermission = status === 'granted';
      set({ hasPermission });
      return hasPermission;
    } catch (error) {
      set({ error: 'Failed to request contacts permission' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  importContacts: async () => {
    const { hasPermission, requestPermission } = get();

    if (hasPermission === null) {
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        set({ error: 'Permission denied to access contacts' });
        return;
      }
    } else if (!hasPermission) {
      set({ error: 'Permission denied to access contacts' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Image,
        ],
      });

      if (data.length > 0) {
        const formattedContacts: Contact[] = data
          .filter((contact): contact is Contacts.Contact & { id: string } =>
            contact.id !== undefined &&
            contact.name !== undefined &&
            contact.phoneNumbers !== undefined &&
            contact.phoneNumbers.length > 0
          )
          .map(contact => ({
            id: contact.id,
            name: contact.name,
            phoneNumber: contact.phoneNumbers?.[0]?.number || '',
            email: contact.emails?.[0]?.email,
            photo: contact.imageAvailable && contact.image ?
              (Platform.OS === 'android' ? contact.image.uri : contact.image.uri) :
              undefined,
          }));

        set({ contacts: formattedContacts });
      }
    } catch (error) {
      set({ error: 'Failed to import contacts' });
    } finally {
      set({ loading: false });
    }
  },
}));