import { Control } from "react-hook-form";

interface DynamicField {
    name: string;
    label: string;
    type: "text" | "number" | "email" | "password" | "phone";
    validation?: any;
    placeholder?: string;
    maxLength?: number;
    defaultCode?: string;
}

interface FormFieldsProps {
    control: Control<any>;
    fields: DynamicField[];
    errors: any;
}

export type { DynamicField, FormFieldsProps };
