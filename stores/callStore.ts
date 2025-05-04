/**
 * @file callStore.ts
 * @description Store for managing call-related state and operations
 * @author System
 */

import { create } from 'zustand';
import { Contact } from './contactStore';

export type CallStatus = 'idle' | 'calling' | 'connected' | 'completed' | 'failed';

/**
 * @interface CallHistory
 * @description Represents a record of a completed call session
 * @property {string} id - Unique identifier for the call history entry
 * @property {string} groupName - Name of the group that was called
 * @property {number} totalContacts - Total number of contacts in the call group
 * @property {number} contactsReached - Number of contacts successfully reached
 * @property {number} duration - Duration of the call session in seconds
 * @property {string} date - ISO timestamp of when the call was made
 * @property {string} [message] - Optional message that was played during the call
 */
export type CallHistory = {
  id: string;
  groupName: string;
  totalContacts: number;
  contactsReached: number;
  duration: number; // in seconds
  date: string;
  message?: string;
};

/**
 * @interface CallState
 * @description State management interface for call operations
 * @property {Object} currentCall - Information about the ongoing call
 * @property {Contact[]} currentCall.contacts - List of contacts to be called
 * @property {number} currentCall.currentIndex - Index of the current contact being called
 * @property {CallStatus} currentCall.status - Current status of the call
 * @property {string} [currentCall.message] - Message to be played during the call
 * @property {boolean} currentCall.isAutomated - Whether the call is automated
 * @property {string} [currentCall.groupName] - Name of the group being called
 * @property {CallHistory[]} history - List of past call sessions
 */
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

/**
 * @function useCallStore
 * @description Zustand store hook for managing call state and operations
 * @returns {CallState} The call store state and operations
 * 
 * @example
 * const { currentCall, startCall, endCall } = useCallStore();
 * 
 * // Start a new call session
 * startCall(contacts, "Hello, this is an automated message", true, "Team Meeting");
 * 
 * // End the current call
 * endCall();
 */
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