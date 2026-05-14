import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignupScreen } from './src/screens/auth/SignupScreen';
import { logout, subscribeToAuthChanges } from './src/services/firebase/authService';
import { useAuthStore } from './src/store/authStore';
import { useThemeStore } from './src/store/themeStore';

type AuthView = 'login' | 'signup';

function HomeScreen() {
  const accentColor = useThemeStore(state => state.accentColor);
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.isLoading);

  return (
    <View style={styles.homeScreen}>
      <View style={styles.homeCard}>
        <Text style={styles.homeTitle}>Welcome to Melodisc</Text>
        <Text style={styles.homeSubtitle}>
          {user?.email ?? 'You are signed in.'}
        </Text>
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isLoading}
          onPress={logout}
          style={[
            styles.logoutButton,
            { backgroundColor: accentColor },
            isLoading && styles.disabledButton,
          ]}
        >
          <Text style={styles.logoutButtonText}>
            {isLoading ? 'Signing out...' : 'Log Out'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function App() {
  console.log('App Rendering');

  const [authView, setAuthView] = useState<AuthView>('login');
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    return subscribeToAuthChanges();
  }, []);

  if (isLoading && !user) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#BDEBFF" />
        <Text style={styles.loadingText}>Loading Melodisc...</Text>
      </View>
    );
  }

  if (user) {
    return <HomeScreen />;
  }

  if (authView === 'signup') {
    return <SignupScreen onShowLogin={() => setAuthView('login')} />;
  }

  return <LoginScreen onShowSignup={() => setAuthView('signup')} />;
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: '#000000',
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
  },
  homeScreen: {
    alignItems: 'center',
    backgroundColor: '#000000',
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    padding: 24,
    width: '100%',
  },
  homeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 420,
    padding: 24,
    shadowColor: '#BDEBFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    width: '100%',
    zIndex: 1,
  },
  homeTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0,
  },
  homeSubtitle: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  logoutButton: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 52,
  },
  disabledButton: {
    opacity: 0.68,
  },
  logoutButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default App;
