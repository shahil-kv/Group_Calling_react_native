interface CallSession {
    id: string;
    user_id: string;
    group_id: string;
    status: string;
    total_calls: number;
    successful_calls: number;
    failed_calls: number;
    created_at: string;
    updated_at: string;
}

export const LIST_CONFIG = {
    INITIAL_NUM_TO_RENDER: 10,
    MAX_TO_RENDER_PER_BATCH: 10,
    WINDOW_SIZE: 5,
};

interface CallHistoryItem {
    id: number;
    contact_phone: string;
    status: 'FAILED' | 'ANSWERED' | 'IN_PROGRESS' | 'MISSED' | 'VOICEMAIL' | string;
    called_at: string;
    duration: number | null;
    error_message: string | null;
    message_content: string;
    group_id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    ended_at: string | null;
    answered_at: string | null;
    attempt: number;
    max_attempts: number;
    call_sid: string | null;
    contact_id: number | null;
    session_id: number;
}

interface GroupItem {
    id: number;
    user_id: number;
    group_name: string;
    description: string;
    group_type: string;
    created_at: string;
    updated_at: string;
}

export type { CallHistoryItem, CallSession, GroupItem };
