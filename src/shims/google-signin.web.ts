// Web mock for @react-native-google-signin/google-signin
export const GoogleSignin = {
  configure: () => {},
  hasPlayServices: async () => true,
  signIn: async () => ({ data: { idToken: null } }),
};
