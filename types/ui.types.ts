import { ReactNode } from "react";
import { TouchableOpacityProps } from "react-native";

export interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: "primary" | "secondary" | "outline" | "danger";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export interface DynamicField {
    name: string;
    label: string;
    type: "text" | "number" | "email" | "password" | "phone";
    validation?: any;
    placeholder?: string;
    maxLength?: number;
    defaultCode?: string;
} 