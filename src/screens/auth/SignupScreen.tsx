import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react-native';

import { googleLogin, signupEmail } from '../../services/firebase/authService';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { webShadowStyle } from '../../theme/glassStyles';

// @ts-ignore Vite resolves PNG imports to URLs for web; Metro resolves them for native.
import melodiscLogo from '../../assets/melodisc_logo.png';
// @ts-ignore
import googleLogo from '../../assets/google_logo.png';

type SignupScreenProps = {
  onShowLogin: () => void;
};

const logoSource =
  typeof melodiscLogo === 'string' ? { uri: melodiscLogo } : melodiscLogo;

const googleLogoSource =
  typeof googleLogo === 'string' ? { uri: googleLogo } : googleLogo;

export function SignupScreen({ onShowLogin }: SignupScreenProps) {
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const authError = useAuthStore(state => state.authError);
  const isLoading = useAuthStore(state => state.isLoading);
  const setAuthError = useAuthStore(state => state.setAuthError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const cardEntrance = useRef(new Animated.Value(0)).current;

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

  // ── Password match validation (derived state) ──
  const passwordsEmpty = password === '' || confirmPassword === '';
  const passwordsMatch = password === confirmPassword;
  const confirmFieldTouched = confirmPassword.length > 0;

  const isSubmitDisabled = isLoading || passwordsEmpty || !passwordsMatch;

  const handleSignup = useCallback(async () => {
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match. Please try again.');
      return;
    }

    await signupEmail(email.trim(), password);
  }, [email, password, confirmPassword, setAuthError]);

  const handleGoogleLogin = async () => {
    await googleLogin();
  };

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const accentTextStyle = { color: primaryAccent };
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
        <Text style={styles.subtitle}>Create an account and start listening.</Text>
      </View>

      <Animated.View style={[styles.card, webShadowStyle, cardAnimatedStyle]}>
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

        {/* Password input with visibility toggle */}
        <View style={styles.passwordContainer}>
          <TextInput
            autoCapitalize="none"
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

        {/* Confirm password input with visibility toggle */}
        <View style={styles.passwordContainer}>
          <TextInput
            autoCapitalize="none"
            onChangeText={value => {
              setAuthError(null);
              setConfirmPassword(value);
            }}
            placeholder="Confirm password"
            placeholderTextColor="#77777D"
            secureTextEntry={!showConfirmPassword}
            style={styles.passwordInput}
            value={confirmPassword}
          />
          <TouchableOpacity
            accessibilityLabel={
              showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
            }
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={toggleConfirmPasswordVisibility}
            style={styles.eyeButton}
          >
            {showConfirmPassword ? (
              <EyeOff color="#77777D" size={20} strokeWidth={2} />
            ) : (
              <Eye color="#77777D" size={20} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>

        {/* Real-time password match indicator */}
        {confirmFieldTouched ? (
          passwordsMatch ? (
            <View style={styles.validationRow}>
              <CheckCircle2 color="#22c55e" size={18} strokeWidth={2} />
              <Text style={[styles.validationText, { color: '#22c55e' }]}>
                Passwords match
              </Text>
            </View>
          ) : (
            <View style={styles.validationRow}>
              <AlertCircle color="#ef4444" size={18} strokeWidth={2} />
              <Text style={[styles.validationText, { color: '#ef4444' }]}>
                Passwords do not match
              </Text>
            </View>
          )
        ) : null}

        {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isSubmitDisabled}
          onPress={handleSignup}
          style={[
            styles.primaryButton,
            { backgroundColor: primaryAccent },
            isSubmitDisabled && styles.disabledButton,
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
          style={[styles.secondaryButton, { borderColor: primaryAccent }]}
        >
          <Image source={googleLogoSource} style={styles.googleIcon} />
          <Text style={styles.secondaryButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.72} onPress={onShowLogin}>
          <Text style={styles.switchText}>
            Already have an account?{' '}
            <Text style={accentTextStyle}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
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
  validationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: -4,
    paddingHorizontal: 4,
  },
  validationText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
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
});

// webShadowStyle imported from shared glassStyles
