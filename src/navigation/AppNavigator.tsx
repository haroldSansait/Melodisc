import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Music2, Settings } from 'lucide-react-native';

import { subscribeToAuthChanges } from '../services/firebase/authService';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useTheme } from '../theme/useTheme';
import { AuthStack } from './AuthStack';

type MainTabParamList = {
  Home: undefined;
  Player: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function PlaceholderScreen({ label }: { label: string }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.placeholderScreen,
        { backgroundColor: theme.colors.background.primary },
      ]}
    >
      <Text
        style={[
          styles.placeholderTitle,
          {
            color: theme.colors.text.primary,
            fontSize: theme.typography.title.large.fontSize,
            lineHeight: theme.typography.title.large.lineHeight,
            fontWeight: theme.typography.title.large.fontWeight,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function HomeScreen() {
  return <PlaceholderScreen label="Home" />;
}

function PlayerScreen() {
  return <PlaceholderScreen label="Player" />;
}

function SettingsScreen() {
  return <PlaceholderScreen label="Settings" />;
}

function HomeTabIcon({ color, size }: { color: string; size: number }) {
  return <Home color={color} size={size} />;
}

function PlayerTabIcon({ color, size }: { color: string; size: number }) {
  return <Music2 color={color} size={size} />;
}

function SettingsTabIcon({ color, size }: { color: string; size: number }) {
  return <Settings color={color} size={size} />;
}

function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background.surface,
          borderTopColor: theme.colors.glass.border,
        },
        tabBarActiveTintColor: theme.colors.accent.secondary,
        tabBarInactiveTintColor: theme.colors.text.muted,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tab.Screen
        name="Player"
        component={PlayerScreen}
        options={{
          tabBarIcon: PlayerTabIcon,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: SettingsTabIcon,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const theme = useTheme();
  const user = useAuthStore(state => state.user);
  const isInitialLoading = useAuthStore(state => state.isInitialLoading);
  const isGuest = usePlayerStore(state => state.isGuest);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges();

    return unsubscribe;
  }, []);

  // Guest sessions are persisted in the player store (AsyncStorage) and hydrate
  // independently of Firebase auth. isInitialLoading only clears once
  // onAuthStateChanged fires — which can take several seconds on Android.
  // A confirmed guest must never be blocked by that delay, so we short-circuit
  // the loading gate when isGuest is already true.
  if (isInitialLoading && !isGuest) {
    return (
      <View
        style={[
          styles.loadingScreen,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        <ActivityIndicator color={theme.colors.accent.secondary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user || isGuest ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    letterSpacing: 0,
  },
});
