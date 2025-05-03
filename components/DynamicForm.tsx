// DynamicForm.tsx
import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { Control, Controller, useForm } from "react-hook-form";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

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

const getKeyboardType = (type: string) => {
  switch (type) {
    case "number":
      return "numeric";
    case "email":
      return "email-address";
    default:
      return "default";
  }
};

const PasswordInput: React.FC<{
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
}> = ({ value, onChange, placeholder, maxLength }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <View className="relative">
      <TextInput
        className="p-4 pr-10 bg-white border border-gray-300 rounded-lg"
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        maxLength={maxLength}
      />
      <TouchableOpacity
        onPress={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-3"
      >
        <Icon
          name={showPassword ? "eye-slash" : "eye"}
          size={20}
          color="gray"
        />
      </TouchableOpacity>
    </View>
  );
};

const PhoneInput: React.FC<{
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  defaultCode?: string;
}> = ({ value, onChange, placeholder, maxLength, defaultCode = "+91" }) => {
  const [countryCode, setCountryCode] = React.useState(defaultCode);
  const [showCountryPicker, setShowCountryPicker] = React.useState(false);

  const commonCountryCodes = [
    { code: "+91", country: "India" },
    { code: "+1", country: "USA" },
    { code: "+44", country: "UK" },
    { code: "+86", country: "China" },
    { code: "+81", country: "Japan" },
  ];

  return (
    <View className="flex-row items-center overflow-hidden bg-white border border-gray-300 rounded-lg">
      <TouchableOpacity
        onPress={() => setShowCountryPicker(true)}
        className="flex-row items-center h-12 px-3 border-r border-gray-300"
      >
        <Text className="mr-1 text-gray-700">{countryCode}</Text>
        <Icon name="chevron-down" size={16} color="gray" />
      </TouchableOpacity>
      <TextInput
        className="flex-1 p-4"
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        keyboardType="phone-pad"
        maxLength={maxLength}
      />
      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View className="items-center justify-center flex-1 bg-black/50">
          <View className="w-4/5 p-4 bg-white rounded-lg">
            {commonCountryCodes.map((item) => (
              <TouchableOpacity
                key={item.code}
                onPress={() => {
                  setCountryCode(item.code);
                  setShowCountryPicker(false);
                }}
                className="py-3 border-b border-gray-200"
              >
                <Text className="text-gray-700">
                  {item.country} ({item.code})
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowCountryPicker(false)}
              className="items-center py-3 mt-4 bg-gray-100 rounded-lg"
            >
              <Text className="text-gray-700">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const FormFields: React.FC<FormFieldsProps> = ({ control, fields, errors }) => {
  return (
    <View className="w-full">
      {fields.map((field) => (
        <View key={field.name} className="mb-4">
          <Text className="mb-2 font-medium text-gray-700">{field.label}</Text>
          <Controller
            control={control}
            name={field.name}
            render={({ field: { onChange, value } }) => {
              if (field.type === "password") {
                return (
                  <PasswordInput
                    value={value}
                    onChange={onChange}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                  />
                );
              } else if (field.type === "phone") {
                return (
                  <PhoneInput
                    value={value}
                    onChange={onChange}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    defaultCode={field.defaultCode}
                  />
                );
              }
              return (
                <TextInput
                  className="p-4 bg-white border border-gray-300 rounded-lg"
                  placeholder={field.placeholder}
                  value={value}
                  onChangeText={onChange}
                  keyboardType={getKeyboardType(field.type)}
                  autoCapitalize="none"
                  maxLength={field.maxLength}
                />
              );
            }}
          />
          {errors[field.name] && (
            <Text className="mt-1 text-sm text-error">
              {String(errors[field.name]?.message)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

export const DynamicForm: React.FC<{
  fields: DynamicField[];
  onSubmit: (data: any) => void;
  defaultValues?: any;
  validationSchema?: any;
  renderButton?: (handleSubmit: () => void) => React.ReactNode;
}> = ({
  fields,
  onSubmit,
  defaultValues = {},
  validationSchema,
  renderButton,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: validationSchema ? yupResolver(validationSchema) : undefined,
  });

  return (
    <View className="w-full">
      <FormFields control={control} fields={fields} errors={errors} />
      {renderButton?.(handleSubmit(onSubmit))}
    </View>
  );
};
