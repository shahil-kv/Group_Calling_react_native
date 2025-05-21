export interface StatusStyle {
    color: string;
    bgColor: string;
    icon: string;
}

export const getStatusStyle = (status: string | undefined): StatusStyle => {
    const statusString = status ? status.toUpperCase() : 'IN_PROGRESS';

    switch (statusString) {
        case 'ACCEPTED':
            return { color: 'text-success', bgColor: 'bg-success/20', icon: 'phone' };
        case 'FAILED':
        case 'MISSED':
            return { color: 'text-danger', bgColor: 'bg-danger/20', icon: 'times-circle' };
        case 'IN_PROGRESS':
            return { color: 'text-warning', bgColor: 'bg-warning/20', icon: 'clock' };
        case 'VOICEMAIL':
            return { color: 'text-info', bgColor: 'bg-info/20', icon: 'envelope' };
        default:
            return { color: 'text-gray-500', bgColor: 'bg-gray-200/20', icon: 'question-circle' };
    }
};