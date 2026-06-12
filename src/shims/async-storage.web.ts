/**
 * async-storage.web.ts
 *
 * Web-compatible shim for @react-native-async-storage/async-storage using standard browser localStorage.
 */

const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors on restricted web contexts
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  },
  clear: async (): Promise<void> => {
    try {
      localStorage.clear();
    } catch {
      // Ignore
    }
  },
};

export default AsyncStorage;
