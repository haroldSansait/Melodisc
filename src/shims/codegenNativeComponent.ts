// Shim for react-native codegen utilities that don't exist in react-native-web.
// This file provides a no-op default export so that libraries like react-native-svg
// can resolve their imports without error when running on the web target.

export default function codegenNativeComponent(_name: string) {
  return () => null;
}
