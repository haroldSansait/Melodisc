import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen onShowSignup={() => navigation.navigate('Signup')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Signup">
        {({ navigation }) => (
          <SignupScreen onShowLogin={() => navigation.navigate('Login')} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
