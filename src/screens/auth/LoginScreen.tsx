import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

import { googleLogin, loginEmail } from '../../services/firebase/authService';
import { useAuthStore } from '../../store/authStore';
import { usePlayerStore } from '../../store/playerStore';
import { useThemeStore } from '../../store/themeStore';
import { webShadowStyle } from '../../theme/glassStyles';

// @ts-ignore Vite resolves PNG imports to URLs for web; Metro resolves them for native.
import melodiscLogo from '../../assets/melodisc_logo.png';
// @ts-ignore
import googleLogo from '../../assets/google_logo.png';

type LoginScreenProps = {
  onShowSignup: () => void;
};

const logoSource =
  typeof melodiscLogo === 'string' ? { uri: melodiscLogo } : melodiscLogo;

const googleLogoSource =
  typeof googleLogo === 'string' ? { uri: googleLogo } : googleLogo;

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30_000;

export function LoginScreen({ onShowSignup }: LoginScreenProps) {
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const authError = useAuthStore(state => state.authError);
  const isLoading = useAuthStore(state => state.isLoading);
  const setAuthError = useAuthStore(state => state.setAuthError);

  const loginAsGuest = usePlayerStore(state => state.loginAsGuest);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── Guest mode state ──
  const [isGuestModalVisible, setIsGuestModalVisible] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState('');
  const [guestNameError, setGuestNameError] = useState<string | null>(null);

  // ── Rate limiting state ──
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const cardEntrance = useRef(new Animated.Value(0)).current;

  // ── Card entrance animation ──
  useEffect(() => {
    const animation = Animated.timing(cardEntrance, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [cardEntrance]);

  // ── Lockout countdown timer ──
  useEffect(() => {
    if (lockoutUntil === null) {
      setLockoutRemaining(0);
      return;
    }

    const computeRemaining = () =>
      Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));

    setLockoutRemaining(computeRemaining());

    const interval = setInterval(() => {
      const remaining = computeRemaining();
      setLockoutRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setLockoutUntil(null);
        setFailedAttempts(0);
        setAuthError(null);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [lockoutUntil, setAuthError]);

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

  const handleLogin = useCallback(async () => {
    if (isLockedOut) {
      return;
    }

    const result = await loginEmail(email.trim(), password);

    if (result.status === 'success') {
      setFailedAttempts(0);
      setLockoutUntil(null);
    } else {
      setPassword('');
      setFailedAttempts(prev => {
        const newCount = prev + 1;
        if (newCount >= MAX_FAILED_ATTEMPTS) {
          const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
          setLockoutUntil(lockoutTime);
          setAuthError(null);
        }
        return newCount;
      });
    }
  }, [email, password, failedAttempts, isLockedOut, setAuthError]);

  const handleGoogleLogin = async () => {
    await googleLogin();
  };

  const handleOpenGuestModal = useCallback(() => {
    setGuestNameInput('');
    setGuestNameError(null);
    setIsGuestModalVisible(true);
  }, []);

  const handleConfirmGuest = useCallback(() => {
    const trimmed = guestNameInput.trim();
    if (!trimmed) {
      setGuestNameError('Please enter at least one character.');
      return;
    }
    setIsGuestModalVisible(false);
    loginAsGuest(trimmed);
  }, [guestNameInput, loginAsGuest]);

  const handleCancelGuest = useCallback(() => {
    setIsGuestModalVisible(false);
    setGuestNameInput('');
    setGuestNameError(null);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const accentTextStyle = { color: primaryAccent };
  const isDisabled = isLoading || isLockedOut;

  const cardAnimatedStyle = {
    opacity: cardEntrance,
    transform: [
      {
        translateY: cardEntrance.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
      {
        scale: cardEntrance.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Image source={logoSource} style={styles.logoImage} />
        <Text style={styles.subtitle}>Your music, your mood, one tap away.</Text>
      </View>

      <Animated.View style={[styles.card, webShadowStyle, cardAnimatedStyle]}>
        <TextInput
          autoCapitalize="none"
          editable={!isLockedOut}
          keyboardType="email-address"
          onChangeText={value => {
            setAuthError(null);
            setEmail(value);
          }}
          placeholder="Email"
          placeholderTextColor="#77777D"
          style={[styles.input, isLockedOut && styles.inputDisabled]}
          value={email}
        />

        {/* Password input with visibility toggle */}
        <View style={[styles.passwordContainer, isLockedOut && styles.inputDisabled]}>
          <TextInput
            autoCapitalize="none"
            editable={!isLockedOut}
            onChangeText={value => {
              setAuthError(null);
              setPassword(value);
            }}
            placeholder="Password"
            placeholderTextColor="#77777D"
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
            value={password}
          />
          <TouchableOpacity
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={togglePasswordVisibility}
            style={styles.eyeButton}
          >
            {showPassword ? (
              <EyeOff color="#77777D" size={20} strokeWidth={2} />
            ) : (
              <Eye color="#77777D" size={20} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>

        {/* Auth error message */}
        {authError && !isLockedOut ? (
          <Text style={styles.errorText}>{authError}</Text>
        ) : null}

        {/* Lockout warning with countdown */}
        {isLockedOut ? (
          <View style={styles.lockoutRow}>
            <Lock color="#FB7185" size={16} strokeWidth={2.5} />
            <Text style={styles.lockoutText}>
              Too many failed attempts. Try again in {lockoutRemaining} second
              {lockoutRemaining !== 1 ? 's' : ''}.
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isDisabled}
          onPress={handleLogin}
          style={[
            styles.primaryButton,
            { backgroundColor: primaryAccent },
            isDisabled && styles.disabledButton,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Signing in...' : isLockedOut ? 'Locked' : 'Log In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isLoading}
          onPress={handleGoogleLogin}
          style={[styles.secondaryButton, { borderColor: primaryAccent }]}
        >
          <Image source={googleLogoSource} style={styles.googleIcon} />
          <Text style={styles.secondaryButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.72} onPress={onShowSignup}>
          <Text style={styles.switchText}>
            New to Melodisc? <Text style={accentTextStyle}>Sign up</Text>
          </Text>
        </TouchableOpacity>

        {/* ── Continue as Guest ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          accessibilityLabel="Continue as Guest"
          activeOpacity={0.78}
          onPress={handleOpenGuestModal}
          style={styles.guestButton}
        >
          <Ionicons color="#B3B3B3" name="person-outline" size={18} />
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Guest Display Name Modal ── */}
      <Modal
        animationType="fade"
        onRequestClose={handleCancelGuest}
        transparent
        visible={isGuestModalVisible}
      >
        <View style={styles.guestModalBackdrop}>
          <View style={styles.guestModalCard}>
            <Text style={styles.guestModalTitle}>Enter Display Name</Text>

            <TextInput
              autoFocus
              maxLength={40}
              onChangeText={value => {
                setGuestNameInput(value);
                if (guestNameError) setGuestNameError(null);
              }}
              placeholder="Your name"
              placeholderTextColor="#77777D"
              returnKeyType="done"
              onSubmitEditing={handleConfirmGuest}
              style={[
                styles.guestNameInput,
                guestNameError ? styles.guestNameInputError : null,
              ]}
              value={guestNameInput}
            />

            {guestNameError ? (
              <View style={styles.guestErrorRow}>
                <Ionicons color="#FB7185" name="alert-circle-outline" size={14} />
                <Text style={styles.guestErrorText}>{guestNameError}</Text>
              </View>
            ) : null}

            <View style={styles.guestModalActions}>
              <TouchableOpacity
                activeOpacity={0.78}
                onPress={handleCancelGuest}
                style={styles.guestCancelButton}
              >
                <Text style={styles.guestCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityLabel="Confirm guest name"
                activeOpacity={0.82}
                onPress={handleConfirmGuest}
                style={[styles.guestConfirmButton, { backgroundColor: primaryAccent }]}
              >
                <Text style={styles.guestConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
  },
  logoImage: {
    height: 140,
    resizeMode: 'contain',
    width: 140,
    marginBottom: -16,
    marginTop: 20,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
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
  inputDisabled: {
    opacity: 0.45,
  },
  passwordContainer: {
    alignItems: 'center',
    backgroundColor: '#18181D',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
  },
  passwordInput: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  eyeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  errorText: {
    color: '#FB7185',
    fontSize: 13,
    lineHeight: 18,
  },
  lockoutRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(251, 113, 133, 0.08)',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  lockoutText: {
    color: '#FB7185',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
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
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
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
  // ── Divider ──
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  dividerLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    color: '#77777D',
    fontSize: 12,
    fontWeight: '600',
  },
  // ── Guest Button ──
  guestButton: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
  },
  guestButtonText: {
    color: '#B3B3B3',
    fontSize: 14,
    fontWeight: '700',
  },
  // ── Guest Modal ──
  guestModalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  guestModalCard: {
    backgroundColor: 'rgba(14, 14, 20, 0.97)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    maxWidth: 400,
    padding: 24,
    width: '100%',
  },
  guestModalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  guestNameInput: {
    backgroundColor: '#18181D',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  guestNameInputError: {
    borderColor: '#FB7185',
  },
  guestErrorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: -8,
  },
  guestErrorText: {
    color: '#FB7185',
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  guestModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  guestCancelButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  guestCancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  guestConfirmButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  guestConfirmButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
});

// webShadowStyle imported from shared glassStyles
