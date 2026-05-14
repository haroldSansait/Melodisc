import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
  type View as ViewType,
} from 'react-native';
import * as anime from 'animejs';

import { googleLogin, signupEmail } from '../../services/firebase/authService';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

type SignupScreenProps = {
  onShowLogin: () => void;
};

export function SignupScreen({ onShowLogin }: SignupScreenProps) {
  const accentColor = useThemeStore(state => state.accentColor);
  const authError = useAuthStore(state => state.authError);
  const isLoading = useAuthStore(state => state.isLoading);
  const setAuthError = useAuthStore(state => state.setAuthError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const cardRef = useRef<ViewType | null>(null);
  const animationRef = useRef<ReturnType<typeof anime.animate> | null>(null);

  useEffect(() => {
    const cardTarget = cardRef.current as Parameters<
      typeof anime.animate
    >[0] | null;

    if (!cardTarget) {
      return undefined;
    }

    animationRef.current = anime.animate(cardTarget, {
      opacity: [1, 1],
      translateY: [20, 0],
      scale: [0.96, 1],
      duration: 650,
      ease: 'easeOutExpo',
    });

    return () => {
      animationRef.current?.pause();
      anime.remove(cardTarget);
      animationRef.current = null;
    };
  }, []);

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match. Please try again.');
      return;
    }

    await signupEmail(email.trim(), password);
  };

  const handleGoogleLogin = async () => {
    await googleLogin();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.logo}>Join Melodisc</Text>
        <Text style={styles.subtitle}>Create an account and start listening.</Text>
      </View>

      <View ref={cardRef} style={[styles.card, webShadowStyle]}>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={value => {
            setAuthError(null);
            setEmail(value);
          }}
          placeholder="Email"
          placeholderTextColor="#77777D"
          style={styles.input}
          value={email}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={value => {
            setAuthError(null);
            setPassword(value);
          }}
          placeholder="Password"
          placeholderTextColor="#77777D"
          secureTextEntry
          style={styles.input}
          value={password}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={value => {
            setAuthError(null);
            setConfirmPassword(value);
          }}
          placeholder="Confirm password"
          placeholderTextColor="#77777D"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
        />

        {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isLoading}
          onPress={handleSignup}
          style={[
            styles.primaryButton,
            { backgroundColor: accentColor },
            isLoading && styles.disabledButton,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Creating...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isLoading}
          onPress={handleGoogleLogin}
          style={[styles.secondaryButton, { borderColor: accentColor }]}
        >
          <Text style={styles.secondaryButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.72} onPress={onShowLogin}>
          <Text style={styles.switchText}>
            Already have an account?{' '}
            <Text style={{ color: accentColor }}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: '#000000',
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    padding: 24,
    width: '100%',
  },
  header: {
    marginBottom: 28,
    width: '100%',
    maxWidth: 420,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    maxWidth: 420,
    opacity: 1,
    padding: 20,
    transform: [{ translateY: 20 }, { scale: 0.96 }],
    width: '100%',
    zIndex: 1,
  },
  input: {
    backgroundColor: '#18181D',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#FB7185',
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.68,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  switchText: {
    color: '#FFFFFF',
    fontSize: 13,
    paddingTop: 4,
    textAlign: 'center',
  },
});

const webShadowStyle = {
  boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.35)',
} as unknown as ViewStyle;
