# Current Architecture

The **Melodisc** app has a dual-platform setup:

## Platform Setup

### Web

Runs via **Vite** using:

- `npm run web`
- `react-native-web`
- `@react-three/fiber` for WebGL rendering
- Browser Audio API

### Native

Configured with:

- React Native CLI
- Expo SDK 55

However, the native setup has **never been tested on native devices**.

---

# Blockers for Expo Go

## 1. `app.json` is missing Expo config

The current `app.json` is in a bare-minimum React Native CLI format.

It is missing important Expo fields such as:

- `expo` key
- `scheme`
- `slug`

## 2. `babel.config.js` uses the wrong preset

The project currently uses:

```js
module:@react-native/babel-preset
```

Instead, Expo projects should use:

```js
babel-preset-expo
```

## 3. `metro.config.js` uses the wrong base config

The project currently uses:

```js
@react-native/metro-config
```

Instead, Expo projects should use:

```js
expo/metro-config
```

## 4. `@react-three/fiber` and `three` are not Expo Go compatible

These libraries require WebGL, which is only available in a browser by default.

On native, full 3D rendering would require either:

- `expo-gl` + `expo-three`
- `react-native-webview` to host a WebGL context

However, **Expo Go does not support custom native modules like `expo-gl`**, because it was removed from the Expo Go runtime in SDK 51+.

## 5. Audio playback uses browser `HTMLAudioElement`

The current `playerStore.ts` creates a new browser audio element:

```ts
new Audio()
```

This does not exist in React Native.

On native, audio playback should use either:

- `expo-av`
- `react-native-track-player`

## 6. Asset paths are web-relative

Current track artwork and audio URLs use paths such as:

```txt
/src/assets/...
```

These only work with Vite's dev server.

On native, assets need to be loaded using:

- `require()`
- `expo-asset`

## 7. `lucide-react-native` needs `react-native-svg`

This should work because both are already installed, and Expo Go includes `react-native-svg`.

---

# Recommended Approach

## Important Note

Full native parity, including the **3D turntable** and **audio playback**, is not achievable in Expo Go without either:

- A development build using `expo-dev-client` that includes `expo-gl`
- Embedding the 3D scene inside a WebView

---

# Minimal "It Works in Expo Go" Plan

To make the app run in Expo Go with limited functionality, the following steps are recommended:

1. Fix the config files:
   - `app.json`
   - `babel.config.js`
   - `metro.config.js`

2. Add a platform-specific audio engine:
   - Use `expo-av` for native audio playback

3. Fix asset resolution for native:
   - Use `require()` or `expo-asset`

4. Provide a fallback UI for the 3D turntable on native:
   - Use static artwork instead of WebGL

5. Ensure the rest of the UI works natively:
   - Auth
   - Library
   - Search
   - Profile

---

# Warning

The **3D turntable room will not render in Expo Go**.

A graceful **2D fallback** is required for native Expo Go testing.

For the full mobile experience, use a **Development Build**:

```bash
npx expo run:android
```

Or use:

```bash
expo-dev-client
```

This builds a custom native app that can include `expo-gl` and provide full 3D support.

This is the recommended approach if the goal is to achieve the complete Melodisc mobile experience.
