import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  signOut,
  type User,
} from 'firebase/auth';

import {
  clearCachedAuthContext,
  useAuthStore,
  type AuthUser,
} from '../../store/authStore';
import { usePlayerStore } from '../../store/playerStore';
import { getFriendlyErrorMessage } from '../../utils/errorHelpers';
import { auth, googleWebClientId } from './firebaseConfig';
import { deleteFirestoreUserAccount } from './firestoreService';


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

function completeAuthRequest(user: AuthUser | null) {
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
  } catch (error: any) {
    console.error('Email Login Error:', error);
    const code = getErrorCode(error);
    const message = getFriendlyErrorMessage(code);
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
  } catch (error: any) {
    console.error('Email Signup Error:', error);
    const code = getErrorCode(error);
    const message = getFriendlyErrorMessage(code);
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
    const { Platform } = await import('react-native');

    if (Platform.OS === 'web') {
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
    } else {
      // Native Android / iOS Flow
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');

      // Configure GoogleSignin with the webClient ID (from our google-services.json type 3 client)
      GoogleSignin.configure({
        webClientId: googleWebClientId,
        offlineAccess: true,
      });

      // Ensure Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Trigger native sign-in dialog
      const signInResult = await GoogleSignin.signIn();

      // Retrieve idToken (supporting both new v12+ API structure and old v10- API structure)
      const idToken = signInResult?.data?.idToken || (signInResult as any)?.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID Token returned from Google.');
      }

      // Create a Firebase credential with the Google ID Token
      const credential = GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase Auth with the Google credential
      const userCredential = await signInWithCredential(auth, credential);
      completeAuthRequest(userCredential.user);

      return {
        status: 'success',
        user: userCredential.user,
      };
    }
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    // If the user simply cancelled or closed the prompt, don't throw an intrusive error
    const isCancel = error?.code === 'SIGN_IN_CANCELLED' || error?.message?.includes('cancel');
    const code = getErrorCode(error);
    const message = isCancel ? 'Sign-in cancelled' : getFriendlyErrorMessage(code);

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
    const player = usePlayerStore.getState();

    if (player && typeof player.reset === 'function') {
      player.reset();
    }

    clearCachedAuthContext();
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
      store.setInitialLoading(false);
      store.setAuthError(null);
    },
    error => {
      const store = useAuthStore.getState();
      store.setAuthError(getFriendlyErrorMessage(getErrorCode(error)));
      store.setLoading(false);
      store.setInitialLoading(false);
    },
  );
}

export async function deleteAccount(): Promise<AuthResult> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return {
      status: 'error',
      error: 'No authenticated user found.',
    };
  }

  beginAuthRequest();

  try {
    // 1. Delete all Firestore data for this user first (while they are still authenticated!)
    await deleteFirestoreUserAccount(currentUser.uid);

    // 2. Clear local store and player states
    const player = usePlayerStore.getState();
    if (player && typeof player.reset === 'function') {
      player.reset();
    }
    clearCachedAuthContext();

    // 3. Delete the user from Firebase Auth
    await currentUser.delete();

    // 4. Update the Zustand auth state to null
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
