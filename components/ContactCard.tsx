import { Contact } from "@/stores/contactStore";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

interface ContactCardProps {
  contact: Contact;
  onEdit?: () => void;
  onDelete?: () => void;
  onCall?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export default function ContactCard({
  contact,
  onEdit,
  onDelete,
  onCall,
  selectable = false,
  selected = false,
  onSelect,
}: ContactCardProps) {
  return (
    <TouchableOpacity
      className={`
        bg-white rounded-lg p-4 mb-3 shadow-sm 
        ${selectable ? "active:bg-gray-100" : ""}
        ${selected ? "bg-primary/5 border border-primary" : ""}
      `}
      onPress={selectable ? onSelect : undefined}
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center flex-1">
          <View className="bg-primary/10 w-10 h-10 rounded-full items-center justify-center">
            <Icon name="user" size={20} color="#1E3A8A" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-medium text-dark">{contact.name}</Text>
            <Text className="text-gray-500">{contact.phoneNumber}</Text>
            {contact.email && (
              <Text className="text-gray-500 text-xs">{contact.email}</Text>
            )}
          </View>
        </View>
        <View className="flex-row">
          {onCall && (
            <TouchableOpacity
              className="mr-4 p-2 bg-primary/10 rounded-full"
              onPress={onCall}
            >
              <Icon name="phone" size={16} color="#1E3A8A" />
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity className="mr-4" onPress={onEdit}>
              <Icon name="edit" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete}>
              <Icon name="trash" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
