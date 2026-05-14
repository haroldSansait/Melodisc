import type { User } from 'firebase/auth';
import { create } from 'zustand';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  authError: string | null;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setAuthError: (authError: string | null) => void;
};

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isLoading: true,
  authError: null,
  setUser: user => set({ user }),
  setLoading: isLoading => set({ isLoading }),
  setAuthError: authError => set({ authError }),
}));
