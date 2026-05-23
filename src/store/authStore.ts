import type { User } from 'firebase/auth';
import { create } from 'zustand';

export const AUTH_CONTEXT_STORAGE_KEY = 'melodisc_auth_context';

export type CachedAuthContext = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isCachedAuthContext: true;
};

export type AuthUser = User | CachedAuthContext;

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  authError: string | null;
  setUser: (user: AuthUser | null) => void;
  setLoading: (isLoading: boolean) => void;
  setAuthError: (authError: string | null) => void;
};

function getLocalStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    return window.localStorage;
  } catch {
    return null;
  }
}

function toCachedAuthContext(user: AuthUser): CachedAuthContext {
  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    isCachedAuthContext: true,
  };
}

export function readCachedAuthContext(): CachedAuthContext | null {
  try {
    const storage = getLocalStorage();

    if (!storage) {
      return null;
    }

    const rawContext = storage.getItem(AUTH_CONTEXT_STORAGE_KEY);

    if (!rawContext) {
      return null;
    }

    const parsedContext = JSON.parse(rawContext) as Partial<CachedAuthContext>;

    if (!parsedContext || typeof parsedContext.uid !== 'string') {
      storage.removeItem(AUTH_CONTEXT_STORAGE_KEY);
      return null;
    }

    return {
      uid: parsedContext.uid,
      email: typeof parsedContext.email === 'string' ? parsedContext.email : null,
      displayName:
        typeof parsedContext.displayName === 'string'
          ? parsedContext.displayName
          : null,
      photoURL:
        typeof parsedContext.photoURL === 'string'
          ? parsedContext.photoURL
          : null,
      isCachedAuthContext: true,
    };
  } catch {
    return null;
  }
}

export function writeCachedAuthContext(user: AuthUser) {
  try {
    const storage = getLocalStorage();

    if (!storage) {
      return;
    }

    storage.setItem(
      AUTH_CONTEXT_STORAGE_KEY,
      JSON.stringify(toCachedAuthContext(user)),
    );
  } catch {
    // Cache writes are best-effort and should never block auth.
  }
}

export function clearCachedAuthContext() {
  try {
    const storage = getLocalStorage();

    if (!storage) {
      return;
    }

    storage.removeItem(AUTH_CONTEXT_STORAGE_KEY);
  } catch {
    // Cache removal is best-effort and protected for restricted browsers.
  }
}

export const useAuthStore = create<AuthState>(set => ({
  user: readCachedAuthContext(),
  isLoading: true,
  authError: null,
  setUser: user => {
    if (user) {
      writeCachedAuthContext(user);
    } else {
      clearCachedAuthContext();
    }

    set({ user });

// Listen for external changes to auth token in localStorage
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', event => {
    if (event.key === AUTH_CONTEXT_STORAGE_KEY && event.newValue === null) {
      // Token was cleared, update auth store state
      useAuthStore.getState().setUser(null);
    }
  });
}
  },
  setLoading: isLoading => set({ isLoading }),
  setAuthError: authError => set({ authError }),
}));
