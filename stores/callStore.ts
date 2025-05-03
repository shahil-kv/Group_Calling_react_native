import { create } from 'zustand';
import { Contact } from './contactStore';

export type CallStatus = 'idle' | 'calling' | 'connected' | 'completed' | 'failed';

export type CallHistory = {
  id: string;
  groupName: string;
  totalContacts: number;
  contactsReached: number;
  duration: number; // in seconds
  date: string;
  message?: string;
};

export type CallState = {
  currentCall: {
    contacts: Contact[];
    currentIndex: number;
    status: CallStatus;
    message?: string;
    isAutomated: boolean;
    groupName?: string;
  };
  history: CallHistory[];
  startCall: (contacts: Contact[], message?: string, isAutomated?: boolean, groupName?: string) => void;
  endCall: () => void;
  moveToNextContact: () => boolean;
  updateStatus: (status: CallStatus) => void;
  setMessage: (message: string) => void;
  addToHistory: (history: CallHistory) => void;
};

export const useCallStore = create<CallState>((set, get) => ({
  currentCall: {
    contacts: [],
    currentIndex: -1,
    status: 'idle',
    isAutomated: false,
  },
  history: [],

  startCall: (contacts, message, isAutomated = false, groupName) => {
    set({
      currentCall: {
        contacts,
        currentIndex: 0,
        status: 'calling',
        message,
        isAutomated,
        groupName,
      },
    });
  },

  endCall: () => {
    const { currentCall } = get();
    
    // Add to history if any contacts were called
    if (currentCall.currentIndex > 0) {
      const callHistory: CallHistory = {
        id: Date.now().toString(),
        groupName: currentCall.groupName || 'Custom Call',
        totalContacts: currentCall.contacts.length,
        contactsReached: currentCall.currentIndex,
        duration: 0, // In a real app, we would track actual duration
        date: new Date().toISOString(),
        message: currentCall.message,
      };
      
      get().addToHistory(callHistory);
    }
    
    set({
      currentCall: {
        contacts: [],
        currentIndex: -1,
        status: 'idle',
        isAutomated: false,
      },
    });
  },

  moveToNextContact: () => {
    const { currentCall } = get();
    const nextIndex = currentCall.currentIndex + 1;
    
    if (nextIndex < currentCall.contacts.length) {
      set({
        currentCall: {
          ...currentCall,
          currentIndex: nextIndex,
          status: 'calling',
        },
      });
      return true;
    } else {
      get().endCall();
      return false;
    }
  },

  updateStatus: (status) => {
    set((state) => ({
      currentCall: {
        ...state.currentCall,
        status,
      },
    }));
  },

  setMessage: (message) => {
    set((state) => ({
      currentCall: {
        ...state.currentCall,
        message,
      },
    }));
  },

  addToHistory: (history) => {
    set((state) => ({
      history: [history, ...state.history],
    }));
  },
}));