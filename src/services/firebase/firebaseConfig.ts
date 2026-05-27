import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// IMPORTANT: The Firebase JS SDK makes standard REST API calls via fetch(),
// NOT native Android SDK calls. Therefore we MUST use the Web API key
// on ALL platforms. The Android key from google-services.json has
// Android app restrictions that block plain HTTP requests.
export const firebaseConfig = {
  apiKey: 'AIzaSyADJK9DBF7VY6VPQQeEgPFPFzPnku098aY',
  authDomain: 'melodisc-57fd2.firebaseapp.com',
  projectId: 'melodisc-57fd2',
  storageBucket: 'melodisc-57fd2.firebasestorage.app',
  messagingSenderId: '889352597122',
  appId: Platform.select({
    web: '1:889352597122:web:98f61ba9041412e56d8e9b',
    default: '1:889352597122:android:ab846e2f626842826d8e9b',
  }),
};

export const googleWebClientId = '889352597122-vgdarfi9gdsj338u1r3ffbivpm2et6lm.apps.googleusercontent.com';

export const app = initializeApp(firebaseConfig);

// On React Native, use initializeAuth with ReactNative persistence
// so the SDK doesn't try to use indexedDB (which doesn't exist in RN).
// On web, getAuth() works fine.
let auth: ReturnType<typeof getAuth>;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
    const { getReactNativePersistence } = require('firebase/auth') as {
      getReactNativePersistence: (storage: unknown) => Persistence;
    };

    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    // AsyncStorage not available - fall back to default
    console.warn('AsyncStorage not available, falling back to getAuth()');
    auth = getAuth(app);
  }
}

export { auth };
export const db = getFirestore(app);
