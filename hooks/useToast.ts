import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info';

export const useToast = () => {
    const showToast = (type: ToastType, message: string) => {
        Toast.show({
            type,
            text1: type === 'error' ? 'Error' : 'Success',
            text2: message,
            position: 'top',
            visibilityTime: 3000,
            autoHide: true,
            topOffset: 50,
            swipeable: true,
        });
    };

    return {
        showSuccess: (message: string) => showToast('success', message),
        showError: (message: string) => showToast('error', message),
        showInfo: (message: string) => showToast('info', message),
    };
}; 