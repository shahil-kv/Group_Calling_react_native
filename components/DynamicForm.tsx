/**
 * @file DynamicForm.tsx
 * @description A reusable form component that dynamically renders form fields based on configuration
 * @author System
 */

// DynamicForm.tsx
import { yupResolver } from '@hookform/resolvers/yup';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { DynamicField, FormFieldsProps } from '../types/dynamic-form';

const getKeyboardType = (type: string) => {
  switch (type) {
    case 'number':
      return 'numeric';
    case 'email':
      return 'email-address';
    default:
      return 'default';
  }
};

/**
 * @component PasswordInput
 * @description A reusable password input component with show/hide functionality
 * @param {Object} props - Component props
 * @param {string} props.value - Current password value
 * @param {(text: string) => void} props.onChange - Callback for password changes
 * @param {string} [props.placeholder] - Placeholder text for the input
 * @param {number} [props.maxLength] - Maximum length of the password
 *
 * @example
 * <PasswordInput
 *   value={password}
 *   onChange={setPassword}
 *   placeholder="Enter your password"
 *   maxLength={20}
 * />
 */
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
        className="p-4 pr-10 border border-gray-300 rounded-lg bg-background-primary placeholder:text-text-secondary"
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
        <Icon name={showPassword ? 'eye-slash' : 'eye'} size={20} color="gray" />
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
}> = ({ value, onChange, placeholder, maxLength, defaultCode = '+91' }) => {
  const [countryCode, setCountryCode] = React.useState(defaultCode);
  const [showCountryPicker, setShowCountryPicker] = React.useState(false);

  const commonCountryCodes = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA' },
    { code: '+44', country: 'UK' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' },
  ];

  const handlePhoneChange = (text: string) => {
    // Remove any existing country code from the input
    const cleanNumber = text.replace(/^\+\d+/, '');
    onChange(cleanNumber);
  };

  // Store the country code in a ref to access it during form submission
  React.useEffect(() => {
    // @ts-ignore - Adding custom property to store country code
    onChange.countryCode = countryCode;
  }, [countryCode]);

  return (
    <View className="flex-row items-center overflow-hidden border border-gray-300 rounded-lg bg-background-primary">
      <TouchableOpacity
        onPress={() => setShowCountryPicker(true)}
        className="flex-row items-center h-12 px-3 border-r border-gray-300"
      >
        <Text className="mr-1 text-text-primary">{countryCode}</Text>
        <Icon name="chevron-down" size={16} color="gray" />
      </TouchableOpacity>
      <TextInput
        className="flex-1 p-4 placeholder:text-text-secondary"
        placeholder={placeholder}
        value={value}
        onChangeText={handlePhoneChange}
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
          <View className="w-4/5 p-4 rounded-lg bg-background-primary">
            {commonCountryCodes.map(item => (
              <TouchableOpacity
                key={item.code}
                onPress={() => {
                  setCountryCode(item.code);
                  setShowCountryPicker(false);
                }}
                className="py-3 border-b border-gray-200"
              >
                <Text className="text-text-primary">
                  {item.country} ({item.code})
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowCountryPicker(false)}
              className="items-center py-3 mt-4 bg-gray-100 rounded-lg"
            >
              <Text className="text-text-primary">Close</Text>
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
      {fields.map(field => (
        <View key={field.name} className="mb-4 ">
          <Text className="mb-2 font-medium text-text-primary">{field.label}</Text>
          <Controller
            control={control}
            name={field.name}
            render={({ field: { onChange, value } }) => {
              if (field.type === 'password') {
                return (
                  <PasswordInput
                    value={value}
                    onChange={onChange}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                  />
                );
              } else if (field.type === 'phone') {
                return (
                  <PhoneInput
                    value={value}
                    onChange={onChange}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    defaultCode="+91"
                  />
                );
              }
              return (
                <TextInput
                  className="p-4 border border-gray-300 rounded-lg bg-background-primary placeholder:text-text-secondary"
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
            <Text className="mt-1 text-sm text-error">{String(errors[field.name]?.message)}</Text>
          )}
        </View>
      ))}
    </View>
  );
};

/**
 * @component DynamicForm
 * @description A flexible form component that renders fields based on configuration
 * @param {Object} props - Component props
 * @param {FormField[]} props.fields - Array of field configurations
 * @param {(data: any) => void} props.onSubmit - Callback for form submission
 * @param {Object} [props.defaultValues] - Default values for form fields
 * @param {Object} [props.validationSchema] - Yup validation schema
 * @param {(handleSubmit: () => void) => React.ReactNode} [props.renderButton] - Custom submit button renderer
 *
 * @example
 * const fields = [
 *   {
 *     name: 'email',
 *     label: 'Email',
 *     type: 'email',
 *     required: true
 *   },
 *   {
 *     name: 'password',
 *     label: 'Password',
 *     type: 'password',
 *     required: true
 *   }
 * ];
 *
 * <DynamicForm
 *   fields={fields}
 *   onSubmit={handleSubmit}
 *   validationSchema={validationSchema}
 * />
 */
export const DynamicForm: React.FC<{
  fields: DynamicField[];
  onSubmit: (data: any) => void;
  defaultValues?: any;
  validationSchema?: any;
  renderButton?: (handleSubmit: () => void) => React.ReactNode;
}> = ({ fields, onSubmit, defaultValues = {}, validationSchema, renderButton }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: validationSchema ? yupResolver(validationSchema) : undefined,
  });

  const handleFormSubmit = (data: any) => {
    // Process phone numbers by concatenating country codes
    const processedData = { ...data };
    fields.forEach(field => {
      if (field.type === 'phone' && data[field.name]) {
        // @ts-ignore - Accessing the stored country code
        const countryCode = control._fields[field.name]?.onChange?.countryCode || '+91';
        processedData[field.name] = `${countryCode}${data[field.name]}`;
      }
    });
    onSubmit(processedData);
  };

  return (
    <View className="w-full">
      <FormFields control={control} fields={fields} errors={errors} />
      {renderButton?.(handleSubmit(handleFormSubmit))}
    </View>
  );
};
