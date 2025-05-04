export interface Contact {
    id: string;
    name: string;
    phoneNumber: string;
    email?: string;
    address?: string;
    notes?: string;
    createdAt: string;
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    contacts: Contact[];
    createdAt: string;
}

export interface ContactStore {
    contacts: Contact[];
    loading: boolean;
    error: string | null;
    hasPermission: boolean | null;
    addContact: (contact: Contact) => void;
    editContact: (id: string, updatedContact: Partial<Contact>) => void;
    deleteContact: (id: string) => void;
    importContacts: () => Promise<void>;
    requestPermission: () => Promise<boolean>;
}

export interface GroupStore {
    groups: Group[];
    selectedGroup: Group | null;
    setSelectedGroup: (group: Group | null) => void;
    addGroup: (name: string, description?: string, contacts?: Contact[]) => void;
    updateGroup: (id: string, updates: Partial<Group>) => void;
    deleteGroup: (id: string) => void;
    addContactToGroup: (groupId: string, contact: Contact) => void;
    removeContactFromGroup: (groupId: string, contactId: string) => void;
} 