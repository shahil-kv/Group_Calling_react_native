import { Text, View } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  numberOfDigits?: number;
  label?: string;
}

export default function CustomOTPInput({ value, onChange, numberOfDigits = 6, label }: OTPInputProps) {
  return (
    <View>
      {label && <Text className="mb-2 font-medium text-gray-700">{label}</Text>}
      <OtpInput
        numberOfDigits={numberOfDigits}
        onTextChange={onChange}
        focusColor="#6366F1"
        focusStickBlinkingDuration={500}
        theme={{
          containerStyle: {
            marginTop: 10,
          },
          pinCodeContainerStyle: {
            width: 40,
            height: 50,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 8,
            backgroundColor: 'white',
          },
          pinCodeTextStyle: {
            color: '#1F2937',
            fontSize: 20,
            fontWeight: '600',
          },
        }}
      />
    </View>
  );
} 