import { NativeModules, Platform } from 'react-native';

const { CallModule } = NativeModules;

interface CallModuleInterface {
    makeCall(phoneNumber: string): Promise<void>;
    endCall(): Promise<void>;
}

// Mock implementation for development
const mockCallModule: CallModuleInterface = {
    makeCall: async (phoneNumber: string) => {
        console.log(`Making call to ${phoneNumber}`);
        return Promise.resolve();
    },
    endCall: async () => {
        console.log('Ending call');
        return Promise.resolve();
    },
};

export const callModule: CallModuleInterface = Platform.select({
    ios: CallModule || mockCallModule,
    android: CallModule || mockCallModule,
    default: mockCallModule,
}); 