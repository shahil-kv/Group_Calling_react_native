// Represents a phone number associated with a contact
import * as Contacts from 'expo-contacts';

export interface Group {
    id: string;
    group_id: string;
    name: string;
    description?: string;
    contacts: any[];
    createdAt: string;
}


export interface GroupStore {
    groups: Group[];
    selectedGroup: Group | null;
    setSelectedGroup: (group: Group | null) => void;
    addGroup: (name: string, description?: string, contacts?: Contacts.Contact[]) => void;
    updateGroup: (id: string, updates: Partial<Group>) => void;
    deleteGroup: (id: string) => void;
    addContactToGroup: (groupId: string, contact: Contacts.Contact) => void;
    removeContactFromGroup: (groupId: string, contactId: string) => void;
} 