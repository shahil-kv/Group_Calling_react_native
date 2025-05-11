// Represents a phone number associated with a contact
interface PhoneNumber {
    id: string;
    label: string;
    number: string;
    digits: string;
    countryCode: string;
}

// Represents a physical address associated with a contact
interface Address {
    id: string;
    label: string;
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    isoCountryCode: string;
}

// Represents a contact with personal and contact information
export interface Contact {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    contactType: 'person' | 'company'; // Assuming 'person' or 'company' as possible types
    imageAvailable: boolean;
    phoneNumbers: PhoneNumber[];
    addresses: Address[];
}


export interface Group {
    id: string;
    group_id: string;
    name: string;
    description?: string;
    contacts: any[];
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