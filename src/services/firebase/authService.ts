import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';

import { useAuthStore } from '../../store/authStore';
import { getFriendlyErrorMessage } from '../../utils/errorHelpers';
import { auth, googleWebClientId } from './firebaseConfig';

type AuthResult = {
  status: 'success' | 'error';
  user?: User;
  error?: string;
};

function getErrorCode(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }

  return 'auth/unknown';
}

function beginAuthRequest() {
  const store = useAuthStore.getState();
  store.setLoading(true);
  store.setAuthError(null);
}

function completeAuthRequest(user: User | null) {
  const store = useAuthStore.getState();
  store.setUser(user);
  store.setAuthError(null);
}

function failAuthRequest(message: string) {
  useAuthStore.getState().setAuthError(message);
}

function endAuthRequest() {
  useAuthStore.getState().setLoading(false);
}

export async function loginEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  beginAuthRequest();

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    completeAuthRequest(credential.user);

    return {
      status: 'success',
      user: credential.user,
    };
  } catch (error) {
    const message = getFriendlyErrorMessage(getErrorCode(error));
    failAuthRequest(message);

    return {
      status: 'error',
      error: message,
    };
  } finally {
    endAuthRequest();
  }
}

export async function signupEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  beginAuthRequest();

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    completeAuthRequest(credential.user);

    return {
      status: 'success',
      user: credential.user,
    };
  } catch (error) {
    const message = getFriendlyErrorMessage(getErrorCode(error));
    failAuthRequest(message);

    return {
      status: 'error',
      error: message,
    };
  } finally {
    endAuthRequest();
  }
}

export async function googleLogin(): Promise<AuthResult> {
  beginAuthRequest();

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      client_id: googleWebClientId,
      prompt: 'select_account',
    });

    const credential = await signInWithPopup(auth, provider);
    completeAuthRequest(credential.user);

    return {
      status: 'success',
      user: credential.user,
    };
  } catch (error) {
    const message = getFriendlyErrorMessage(getErrorCode(error));
    failAuthRequest(message);

    return {
      status: 'error',
      error: message,
    };
  } finally {
    endAuthRequest();
  }
}

export async function logout(): Promise<AuthResult> {
  beginAuthRequest();

  try {
    await signOut(auth);
    completeAuthRequest(null);

    return {
      status: 'success',
    };
  } catch (error) {
    const message = getFriendlyErrorMessage(getErrorCode(error));
    failAuthRequest(message);

    return {
      status: 'error',
      error: message,
    };
  } finally {
    endAuthRequest();
  }
}

export function subscribeToAuthChanges() {
  useAuthStore.getState().setLoading(true);

  return onAuthStateChanged(
    auth,
    user => {
      const store = useAuthStore.getState();
      store.setUser(user);
      store.setLoading(false);
      store.setAuthError(null);
    },
    error => {
      const store = useAuthStore.getState();
      store.setAuthError(getFriendlyErrorMessage(getErrorCode(error)));
      store.setLoading(false);
    },
  );
}
