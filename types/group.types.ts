import { ExtendedContact } from "./contact.types";
// Types
interface GroupItemProps {
    group: Group;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

interface GroupModelReGroup {
    id: number;
    group_name: string;
    description: string;
    contacts: Array<{
        id: number;
        contact_id: string | null;
        name: string;
        first_name: string | null;
        last_name: string | null;
        phone_number: string;
        country_code: string;
        raw_contact: any;
        is_contact_from_device: boolean;
    }>;
}

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
}

// Define the Group type (since we're not using useGroupStore)
interface Group {
    id: string;
    name: string;
    description: string;
    contacts: ExtendedContact[];
    createdAt: string;
}
export type { Group, GroupItemProps, GroupModelReGroup, SearchBarProps };
