# DESIGN.md

# Melodisc Design System

Melodisc is a dark, immersive, Spotify-inspired mobile music application built with React Native. The visual identity combines a premium black interface, soft translucent glassmorphism, neon-like accent lighting, smooth motion, and future-ready 3D music visuals.

This document is the single source of truth for Melodisc’s UI/UX, design tokens, layout rules, component direction, player screen structure, animation direction, and theme customization approach.

---

## 1. Product Identity

### App Name

**Melodisc**

### Product Description

Melodisc is a Spotify-inspired music player application where users can listen to music, manage their music experience, customize the app’s visual theme, and eventually interact with a 3D vinyl-disc-inspired player environment.

The app should feel modern, cinematic, music-focused, and premium.

### Design Keywords

- Dark
- Premium
- Minimal
- Cinematic
- Glassmorphism
- Neon accent
- Music-focused
- Smooth
- Immersive
- 3D-ready
- Themeable

---

## 2. Core UI Direction

Melodisc must use a dark interface as the visual base. The default app atmosphere should be black or near-black, supported by soft light-blur accents.

The interface must not feel crowded. It should prioritize:

- Large visual player area
- Clean spacing
- Rounded containers
- Smooth transitions
- High contrast text
- Glassmorphism panels
- Accent-driven controls
- One-handed mobile usability

The player experience should be the visual center of the application. The design must leave enough space for a future 3D vinyl disc, animated room, music scene, or theme-based environment.

---

## 3. Global Color Palette

### 3.1 Base Dark Theme

| Token | Hex | Usage |
|---|---|---|
| `background.primary` | `#000000` | Main app background |
| `background.secondary` | `#050505` | Secondary screen background |
| `background.elevated` | `#0B0B0F` | Cards and elevated surfaces |
| `background.surface` | `#111116` | Bottom sheets, modals, panels |
| `background.soft` | `#18181D` | Inputs, inactive controls |
| `background.overlay` | `rgba(0, 0, 0, 0.72)` | Modal and overlay background |

### 3.2 Text Colors

| Token | Hex | Usage |
|---|---|---|
| `text.primary` | `#FFFFFF` | Main titles and active labels |
| `text.secondary` | `#B3B3B3` | Subtitles and supporting text |
| `text.muted` | `#77777D` | Metadata and disabled text |
| `text.disabled` | `#4D4D52` | Disabled labels |
| `text.inverse` | `#000000` | Text on bright buttons |

### 3.3 Default Light Blur Accent

The “light blur” visual identity should be implemented as a soft, translucent, glass-like neon accent.

| Token | Hex | Usage |
|---|---|---|
| `accent.primary` | `#BDEBFF` | Main light blur accent |
| `accent.secondary` | `#7DDCFF` | Active controls and progress |
| `accent.glow` | `#A7E9FF` | Glow effects |
| `accent.deep` | `#1DADEB` | Strong accent contrast |
| `accent.soft` | `#E6F8FF` | Light accent highlight |

### 3.4 Feedback Colors

| Token | Hex | Usage |
|---|---|---|
| `feedback.success` | `#4ADE80` | Success state |
| `feedback.warning` | `#FACC15` | Warning state |
| `feedback.error` | `#FB7185` | Error and destructive actions |
| `feedback.info` | `#60A5FA` | Informational state |

---

## 4. Glassmorphism System

The glassmorphism effect must be used carefully. It should support the dark UI rather than overpower it.

### 4.1 Glass Tokens

| Token | Value | Usage |
|---|---|---|
| `glass.background` | `rgba(255, 255, 255, 0.08)` | Default glass panel |
| `glass.backgroundStrong` | `rgba(255, 255, 255, 0.14)` | Active or highlighted glass panel |
| `glass.border` | `rgba(255, 255, 255, 0.18)` | Thin glass border |
| `glass.highlight` | `rgba(189, 235, 255, 0.22)` | Light blur overlay |
| `glass.shadow` | `rgba(125, 220, 255, 0.18)` | Accent glow shadow |

### 4.2 Glass Usage Rules

Use glassmorphism for:

- Player visual containers
- Auth form panels
- Theme preview cards
- Floating music controls
- Bottom utility panels
- Modal surfaces

Avoid glassmorphism for:

- Every list item
- Long text sections
- Large scroll-heavy sections
- Repeated cards that create visual noise

### 4.3 Blur Implementation

Use native-compatible blur libraries only. Do not use CSS `backdrop-filter`, because this is a React Native application.

Preferred approach:

```txt
Use React Native-compatible blur solutions such as expo-blur or @react-native-community/blur depending on the project setup.
```

If blur is unavailable, use translucent backgrounds with borders and shadows as fallback.

---

## 5. Gradient System

Gradients should feel atmospheric and subtle.

### 5.1 Background Gradient

```ts
backgroundGradient = ['#000000', '#050505', '#0B0B0F']
```

### 5.2 Accent Glow Gradient

```ts
accentGlowGradient = [
  'rgba(189, 235, 255, 0.30)',
  'rgba(125, 220, 255, 0.10)',
  'rgba(0, 0, 0, 0)'
]
```

### 5.3 Gradient Rules

Use gradients for:

- Player background atmosphere
- Theme preview cards
- Main visual stage glow
- Selected theme cards

Do not use gradients for:

- All buttons
- All cards
- Text backgrounds
- Overcrowded decorative sections

---

## 6. Typography System

Melodisc should use a clean modern type scale. The default should use system fonts for native performance and consistency.

### 6.1 Default Font

```ts
fontFamily: Platform.select({
  ios: 'System',
  android: 'Roboto',
})
```

If custom fonts are added later, they must be bundled locally and loaded using React Native-supported font loading. Do not use font CDNs.

### 6.2 Type Scale

| Token | Size | Line Height | Weight | Usage |
|---|---:|---:|---|---|
| `display.large` | `36` | `44` | `700` | Large hero titles |
| `display.medium` | `30` | `38` | `700` | Major screen titles |
| `title.large` | `24` | `32` | `700` | Player song title |
| `title.medium` | `20` | `28` | `600` | Section titles |
| `title.small` | `18` | `24` | `600` | Card titles |
| `body.large` | `17` | `24` | `400` | Main body text |
| `body.medium` | `15` | `22` | `400` | Standard text |
| `body.small` | `13` | `18` | `400` | Captions and metadata |
| `label.large` | `15` | `20` | `600` | Buttons |
| `label.medium` | `13` | `18` | `600` | Tabs and chips |
| `label.small` | `12` | `16` | `500` | Small labels |

---

## 7. Spacing System

Use an 8-point spacing system.

| Token | Value | Usage |
|---|---:|---|
| `space.0` | `0` | No spacing |
| `space.1` | `4` | Micro spacing |
| `space.2` | `8` | Small gap |
| `space.3` | `12` | Compact padding |
| `space.4` | `16` | Default padding |
| `space.5` | `20` | Screen horizontal padding |
| `space.6` | `24` | Section padding |
| `space.8` | `32` | Large section gap |
| `space.10` | `40` | Major layout spacing |
| `space.12` | `48` | Hero spacing |

### Default Screen Padding

```ts
screen.horizontalPadding = 20
screen.verticalPadding = 24
```

All major screens must use safe areas.

---

## 8. Radius System

| Token | Value | Usage |
|---|---:|---|
| `radius.sm` | `8` | Small controls |
| `radius.md` | `12` | Inputs and small cards |
| `radius.lg` | `18` | Main cards |
| `radius.xl` | `24` | Player panels |
| `radius.2xl` | `32` | Artwork and 3D stage |
| `radius.full` | `999` | Pills and circular buttons |

---

## 9. Shadow and Glow System

Since Melodisc is dark, shadows should be subtle and glow-based.

### 9.1 Default Card Shadow

```ts
shadowColor: '#000000'
shadowOpacity: 0.35
shadowRadius: 16
shadowOffset: { width: 0, height: 8 }
elevation: 8
```

### 9.2 Accent Glow

```ts
shadowColor: theme.colors.accent.glow
shadowOpacity: 0.25
shadowRadius: 20
shadowOffset: { width: 0, height: 0 }
elevation: 10
```

### 9.3 Glow Usage

Glow effects should be used only for:

- Active play button
- Active player visual
- Selected theme preview
- Active tabs
- Current progress
- Important focus states

Do not apply glow effects to every card.

---

## 10. Layout Principles

### General Rules

- Use dark backgrounds as the base.
- Use glass panels only for important containers.
- Avoid placing too many bordered cards on one screen.
- Keep music artwork and player controls as the main focus.
- Use spacing instead of dividers when possible.
- Prefer large touch targets.
- Keep animation smooth but not distracting.
- Design for one-handed mobile use.
- Avoid web-like layouts.

### Touch Target Sizes

Minimum touch target:

```ts
minWidth: 44
minHeight: 44
```

Primary play/pause button:

```ts
width: 72
height: 72
borderRadius: 36
```

---

## 11. Recommended Project UI Structure

```txt
src/
  components/
    common/
      AppText.tsx
      AppButton.tsx
      GlassCard.tsx
      IconButton.tsx
      Screen.tsx
    player/
      PlayerArtworkStage.tsx
      PlayerControls.tsx
      PlayerProgressBar.tsx
      PlayerTrackInfo.tsx
      PlayerQueuePreview.tsx
    theme/
      ThemePreviewCard.tsx
      AccentColorPicker.tsx
  screens/
    auth/
      LoginScreen.tsx
      SignupScreen.tsx
    player/
      PlayerScreen.tsx
    theme/
      ThemeCustomizationScreen.tsx
  theme/
    colors.ts
    spacing.ts
    typography.ts
    radius.ts
    shadows.ts
    ThemeProvider.tsx
    useTheme.ts
  services/
    firebase/
      firebaseConfig.ts
      authService.ts
      firestoreService.ts
      userService.ts
  store/
    themeStore.ts
    authStore.ts
    playerStore.ts
  hooks/
  utils/
  types/
  assets/
```

---

## 12. Player Screen Structure

The Player Screen is the most important screen in Melodisc. It should be designed around the future 3D vinyl disc or immersive scene.

### Required Structure

```txt
PlayerScreen
│
├── SafeArea Screen Container
│
├── Header
│   ├── Back / Collapse Button
│   ├── Screen Label or Playlist Name
│   └── More Options Button
│
├── PlayerArtworkStage
│   ├── Future 3D Vinyl / Scene Canvas
│   ├── Light Blur Glow Layer
│   └── Optional Animated Particles / Mood Background
│
├── PlayerTrackInfo
│   ├── Song Title
│   ├── Artist Name
│   └── Like / Save Button
│
├── PlayerProgressBar
│   ├── Current Time
│   ├── Slider
│   └── Duration
│
├── PlayerControls
│   ├── Shuffle
│   ├── Previous
│   ├── Play / Pause
│   ├── Next
│   └── Repeat
│
└── Bottom Utility Area
    ├── Queue Button
    ├── Device Button
    └── Theme Button
```

---

## 13. PlayerArtworkStage

The `PlayerArtworkStage` component should act as the reserved visual space for the future 3D asset.

### Current Purpose

Before 3D is implemented, this section can display:

- Album artwork
- Placeholder vinyl disc
- Animated glow
- Glassmorphism scene container
- Mood-based background

### Future Purpose

Later, this component will render:

- 3D vinyl disc
- 3D music room scene
- Rotating music object
- Scene themes such as rain room, sunset, neon city, or space room

### Component Boundary

```txt
PlayerArtworkStage
└── MusicSceneCanvas
    ├── VinylDisc
    ├── SceneLighting
    ├── ThemeEnvironment
    └── CameraControls
```

### Suggested Dimensions

```ts
artworkStage: {
  width: '100%',
  aspectRatio: 1,
  borderRadius: 32,
  marginVertical: 24,
}
```

### Design Rules

- Keep the visual stage centered.
- Use a square or near-square area.
- Use a soft glow behind the asset.
- Avoid heavy text inside the visual area.
- Prepare the component so it can later use `Canvas` from `@react-three/fiber/native`.
- Always provide a fallback visual when 3D is unavailable.

---

## 14. Player UI Components

### 14.1 PlayerTrackInfo

Rules:

- Song title uses `title.large`.
- Artist name uses `body.medium`.
- Text should be center-aligned on the full player screen.
- Long text should truncate gracefully.
- Like/save button should use accent color only when active.

### 14.2 PlayerProgressBar

Rules:

- Active progress uses `theme.colors.accent.secondary`.
- Inactive progress uses muted grey.
- Time labels use `body.small`.
- Slider should support theme colors.
- Avoid overly thick progress bars.

### 14.3 PlayerControls

Rules:

- Play/Pause button is the visual anchor.
- Secondary controls should be icon buttons.
- Use large spacing between controls.
- Active states use the current theme accent.
- Buttons must have accessibility labels.

---

## 15. Authentication UI

### Login Screen Required Elements

- Melodisc logo or wordmark
- Email input
- Password input
- Login button
- Google sign-in button
- Link to Signup
- Minimal background glow

### Signup Screen Required Elements

- Name input, if needed
- Email input
- Password input
- Confirm password input
- Signup button
- Google sign-in button
- Link back to Login

### Auth Design Rules

- Inputs should use dark glass panels.
- Primary button should use the selected accent color.
- Google button should remain visually clear and accessible.
- Error messages should use `feedback.error`.
- Firebase loading states must be visible.

---

## 16. Theme Customization Engine

Melodisc must allow users to change the global accent/theme colors natively.

### 16.1 State Management Decision

Use **Zustand** for theme customization state.

Reason:

- Lightweight
- Simple global state management
- Cleaner than deeply nested React Context
- Easy to persist later
- Works well with React Native
- Helps avoid unnecessary re-renders when selectors are used properly

React Context may still be used to expose the computed theme object to the component tree, but the source of truth for user-selected theme values should be Zustand.

### 16.2 Theme State Shape

```ts
type ThemeMode = 'dark'

type AccentPreset = {
  id: string
  name: string
  primary: string
  secondary: string
  glow: string
}

type ThemeState = {
  mode: ThemeMode
  selectedAccentId: string
  customAccent?: AccentPreset
  useCustomAccent: boolean

  setAccentPreset: (accentId: string) => void
  setCustomAccent: (accent: AccentPreset) => void
  resetTheme: () => void
}
```

### 16.3 Default Accent Presets

```ts
const accentPresets = [
  {
    id: 'light-blur',
    name: 'Light Blur',
    primary: '#BDEBFF',
    secondary: '#7DDCFF',
    glow: '#A7E9FF',
  },
  {
    id: 'neon-violet',
    name: 'Neon Violet',
    primary: '#D8B4FE',
    secondary: '#A855F7',
    glow: '#C084FC',
  },
  {
    id: 'mint-wave',
    name: 'Mint Wave',
    primary: '#A7F3D0',
    secondary: '#34D399',
    glow: '#6EE7B7',
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Amber',
    primary: '#FDE68A',
    secondary: '#F59E0B',
    glow: '#FBBF24',
  },
]
```

### 16.4 Theme Application Rules

Every component must consume colors from the theme system.

Correct:

```ts
backgroundColor: theme.colors.background.primary
```

Incorrect:

```ts
backgroundColor: '#000000'
```

The following must always be theme-driven:

- Buttons
- Progress bars
- Active icons
- Selected tabs
- Sliders
- Glass highlights
- Glow effects
- Player visual accent
- Theme preview cards
- Auth button states

---

## 17. Theme Persistence

The selected theme should eventually be persisted using:

```txt
AsyncStorage for local persistence
Cloud Firestore for optional user profile sync
```

Recommended behavior:

1. Load locally saved theme first.
2. Apply the theme immediately.
3. If the user is logged in, optionally sync with Firestore.
4. Local theme should still work offline.
5. If Firestore sync fails, local theme should remain active.

---

## 18. Animation Design Rules

Melodisc should use animation to support mood and interaction.

### Animation Principles

- Smooth
- Subtle
- Music-inspired
- Never overwhelming
- Avoid constant heavy motion
- Keep performance stable on mobile devices

### Recommended Uses for `animejs`

Use `animejs` for:

- Button press micro-interactions
- Glass card entrance animations
- Glow pulse effects
- Player visual stage transitions
- Theme switching transitions

Do not use `animejs` for:

- Large lists
- Heavy background loops
- Animations that run forever without cleanup
- Gesture-driven animation better handled by native animation tools

---

## 19. 3D Design Preparation

Melodisc will later use:

```txt
three
@react-three/fiber
@react-three/drei
```

### 3D Asset Rules

- 3D visuals should be isolated inside dedicated components.
- 3D rendering should not be mixed with normal UI layout logic.
- Player screen should continue to work even if the 3D scene fails to load.
- Provide fallback artwork or a static vinyl placeholder.
- Keep 3D assets optimized for mobile.
- Avoid heavy shadows, high-poly models, and large textures.

---

## 20. Accessibility Rules

Melodisc must remain readable and usable.

### Required Accessibility Practices

- Text contrast must remain high.
- Icon buttons must have accessibility labels.
- Touch targets must be at least 44x44.
- Do not rely on color alone for meaning.
- Error messages must be readable.
- Theme customization must not allow unreadable combinations.
- Controls must clearly communicate selected and disabled states.

---

## 21. Design Quality Checklist

Before completing any screen, verify:

- The screen follows the dark theme.
- Accent colors come from the theme system.
- Components are not overcrowded.
- Spacing follows the 8-point system.
- Text is readable.
- Buttons have clear states.
- The UI works on small and large phones.
- Firebase logic is not inside UI components.
- Animations clean up properly.
- Future 3D integration will not require rewriting the full screen.
