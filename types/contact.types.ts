// Represents a phone number associated with a contact
import * as Contacts from 'expo-contacts';

interface Group {
    id: string;
    group_id: string;
    name: string;
    description?: string;
    contacts: any[];
    createdAt: string;
}


interface ExtendedContact extends Contacts.Contact {
    isContactFromDevice?: boolean;
}

interface ContactSelectorProps {
    visible: boolean;
    onClose: () => void;
    onDone: (selectedContacts: ExtendedContact[]) => void;
    initialSelectedContacts?: ExtendedContact[];
}

interface ContactItemProps {
    item: ExtendedContact;
    isSelected: boolean;
    toggleContact: (c: ExtendedContact) => void;
}


interface GroupStore {
    groups: Group[];
    selectedGroup: Group | null;
    setSelectedGroup: (group: Group | null) => void;
    addGroup: (name: string, description?: string, contacts?: ExtendedContact[]) => void;
    updateGroup: (id: string, updates: Partial<Group>) => void;
    deleteGroup: (id: string) => void;
    addContactToGroup: (groupId: string, contact: Contacts.Contact) => void;
    removeContactFromGroup: (groupId: string, contactId: string) => void;
}

export type { ContactItemProps, ContactSelectorProps, ExtendedContact, Group, GroupStore };
