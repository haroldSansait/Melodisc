import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MelodiscLogo } from '../../components/MelodiscLogo';
import { googleLogin, loginEmail } from '../../services/firebase/authService';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { webShadowStyle } from '../../theme/glassStyles';

type LoginScreenProps = {
  onShowSignup: () => void;
};

export function LoginScreen({ onShowSignup }: LoginScreenProps) {
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const authError = useAuthStore(state => state.authError);
  const isLoading = useAuthStore(state => state.isLoading);
  const setAuthError = useAuthStore(state => state.setAuthError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async () => {
    await loginEmail(email.trim(), password);
  };

  const handleGoogleLogin = async () => {
    await googleLogin();
  };

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
        <MelodiscLogo size={72} accentColor={primaryAccent} />
        <Text style={styles.logo}>Melodisc</Text>
        <Text style={styles.subtitle}>Your music, your mood, one tap away.</Text>
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

        {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isLoading}
          onPress={handleLogin}
          style={[
            styles.primaryButton,
            { backgroundColor: primaryAccent },
            isLoading && styles.disabledButton,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Signing in...' : 'Log In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isLoading}
          onPress={handleGoogleLogin}
          style={[styles.secondaryButton, { borderColor: primaryAccent }]}
        >
          <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }} style={styles.googleIcon} />
          <Text style={styles.secondaryButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.72} onPress={onShowSignup}>
          <Text style={styles.switchText}>
            New to Melodisc? <Text style={accentTextStyle}>Sign up</Text>
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

  logo: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
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
