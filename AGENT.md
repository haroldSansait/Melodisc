# AGENT.md

# Melodisc AI Development Agent Instructions

You are assisting with the development of **Melodisc**, a Spotify-inspired mobile music application built with React Native.

Act as a Principal Mobile Engineer and AI Architect. Prioritize clean architecture, maintainability, mobile performance, design consistency, animation safety, Firebase separation, and future support for advanced 3D music visuals.

Do not treat this project as a quick prototype. Build and suggest solutions as if this will become a real production mobile application.

---

## 1. Project Context

Melodisc is a React Native mobile music player application with the following planned features:

- Login and signup flow
- Firebase Authentication using:
  - Google Sign-In
  - Email and Password
- Cloud Firestore database
- Music Player UI
- Theme Customization engine
- Future 3D player visual experience
- Complex UI animation support using `animejs`
- Future 3D rendering using:
  - `three`
  - `@react-three/fiber`
  - `@react-three/drei`

---

## 2. Core Technical Stack

Use the following stack:

```txt
React Native
Firebase Auth
Cloud Firestore
Zustand for global state
animejs for complex UI animations
three for 3D rendering foundation
@react-three/fiber for React-based 3D rendering
@react-three/drei for useful 3D helpers
```

Do not replace the stack unless explicitly instructed.

---

## 3. Strict Dependency Rules

### Required Installation Method

Always use:

```bash
npm install
```

Never use:

```txt
CDNs
remote script tags
unpkg
jsdelivr
browser-based dependency loading
manual script injection
```

All dependencies must be installed locally through npm.

### Examples

Correct:

```bash
npm install firebase zustand animejs three @react-three/fiber @react-three/drei
```

Incorrect:

```html
<script src="https://cdn.jsdelivr.net/npm/animejs"></script>
```

---

## 4. React Native Boundary Rules

This is a React Native mobile application, not a web application.

Avoid web-only APIs:

```txt
document.querySelector
document.getElementById
window
localStorage
sessionStorage
HTML canvas DOM APIs
CSS files intended for browsers
CDN imports
```

Use React Native-compatible APIs and libraries only.

If a package or example is designed for web, verify React Native compatibility before using it.

---

## 5. Architecture Rules

### Separation of Concerns

Always separate:

```txt
UI components
screen composition
state management
Firebase services
theme configuration
navigation logic
animation utilities
3D rendering components
types
helpers
```

Do not place Firebase queries directly inside visual UI components.

Incorrect:

```txt
LoginScreen contains Firebase auth implementation directly.
```

Correct:

```txt
LoginScreen calls authService.signInWithEmail().
```

---

## 6. Required Folder Direction

Use this structure as the preferred architecture:

```txt
src/
  components/
    common/
    player/
    theme/
  screens/
    auth/
    player/
    theme/
  navigation/
  services/
    firebase/
  store/
  theme/
  hooks/
  utils/
  types/
  assets/
```

### Folder Responsibilities

```txt
components/
Reusable UI components only.

screens/
Full screen-level layouts.

navigation/
Navigation stacks, tabs, and route typing.

services/firebase/
Firebase config, auth service, Firestore service, and user service.

store/
Global app state such as auth state, theme state, and player state.

theme/
Design tokens, color system, spacing, typography, radius, shadows, and theme provider.

hooks/
Reusable business or UI hooks.

utils/
Pure helper functions.

types/
Shared TypeScript types.

assets/
Images, icons, 3D assets, and static resources.
```

---

## 7. Firebase Rules

### Firebase Logic Must Be Isolated

Firebase code must live inside:

```txt
src/services/firebase/
```

Recommended files:

```txt
firebaseConfig.ts
authService.ts
firestoreService.ts
userService.ts
```

### Authentication Rules

Use Firebase Auth for:

- Email/password signup
- Email/password login
- Google authentication
- Logout
- Auth state listener

Authentication screens should call service functions. They should not contain low-level Firebase implementation details.

### Firestore Rules

Use Cloud Firestore for:

- User profile data
- Saved theme settings
- Future playlists
- Future library metadata
- Future listening preferences

Suggested collections:

```txt
users
playlists
tracks
themePreferences
```

### Error Handling

Every Firebase operation must include error handling.

Do not silently fail.

Return clear states such as:

```txt
loading
success
error
idle
```

---

## 8. Theme System Rules

Melodisc must support native theme customization.

### Preferred State Management

Use Zustand for theme state.

React Context may be used only to expose computed theme values, but Zustand should store user-selected theme preferences.

### Theme Rules

Never hardcode app colors inside components unless temporary or explicitly required.

Correct:

```ts
theme.colors.accent.primary
theme.colors.background.primary
theme.colors.text.secondary
```

Incorrect:

```ts
'#BDEBFF'
'#000000'
'#FFFFFF'
```

### Theme Customization Requirements

Any theme customization implementation must support:

- Default Light Blur accent
- Multiple accent presets
- Custom accent values
- Immediate global UI update
- Future local persistence
- Future Firestore sync
- Offline theme availability

---

## 9. UI Rules

### Required Design Style

Melodisc must follow this design direction:

```txt
Dark
Premium
Minimal
Glassmorphism
Music-focused
Light blur accent
Smooth animations
Future 3D-ready
Themeable
```

### UI Restrictions

Avoid:

- Overcrowded dashboards
- Excessive borders
- Bright full-screen colors
- Too many gradients
- Heavy animations on every element
- Web-looking UI
- Unstructured styling
- Hardcoded design values

Prefer:

- Dark backgrounds
- Soft glass panels
- Rounded components
- Large player visual area
- Clean spacing
- High contrast text
- Theme-driven accent colors
- Mobile-first layout

---

## 10. Player Screen Rules

The Player Screen is the core visual experience of Melodisc.

### Required Structure

```txt
PlayerScreen
├── Header
├── PlayerArtworkStage
├── PlayerTrackInfo
├── PlayerProgressBar
├── PlayerControls
└── BottomUtilityActions
```

### PlayerArtworkStage Rule

The `PlayerArtworkStage` must be created as a replaceable container for future 3D visuals.

Do not tightly couple the player layout to a static image. The visual area must later support a `Canvas` from `@react-three/fiber/native`.

### Fallback Rule

When 3D is unavailable, the player screen must still show a working fallback visual such as:

- Album artwork
- Static vinyl disc
- Gradient glow
- Glassmorphism placeholder

---

## 11. `animejs` Rules for React Native

`animejs` may be used for complex UI animation, but it must be handled carefully within the React Native lifecycle.

### Allowed Uses

Use `animejs` for:

- Entry transitions
- Glow pulse effects
- Theme transition animations
- Button micro-interactions
- Player visual stage transitions
- Subtle glass card motion

### Avoid Using `animejs` For

Avoid using `animejs` for:

- Animating large lists
- Infinite animations without cleanup
- Heavy background effects
- Gesture-driven animations
- Animations that cause frame drops
- Animations that recreate on every render

### Lifecycle Rules

When using `animejs` inside a React component:

1. Start animations inside `useEffect`.
2. Store animation instances in refs.
3. Clean up animations on unmount.
4. Pause, remove, or cancel active animations when the component unmounts.
5. Avoid creating new animation instances on every render.
6. Avoid uncontrolled infinite loops.
7. Stop animations when the screen loses focus if they are visually unnecessary.

Required rule:

```txt
Any animejs animation created inside a component must have cleanup logic.
```

### Memory Leak Prevention

Never create uncontrolled infinite animations.

If using:

```txt
loop: true
```

then the component must stop that animation during cleanup.

Required cleanup behavior:

```txt
pause animation
remove animation target
clear animation reference
```

---

## 12. React Three Fiber Rules

Melodisc will use:

```txt
three
@react-three/fiber
@react-three/drei
```

for future 3D visuals.

### Installation Rule

Always install using npm:

```bash
npm install three @react-three/fiber @react-three/drei
```

Never use CDN imports.

---

## 13. React Three Fiber in React Native

When using React Three Fiber in React Native, verify compatibility before implementation.

Do not assume browser-based React Three Fiber examples will work directly in React Native.

Avoid web-only APIs such as:

```txt
canvas DOM elements
window resize listeners
document events
browser pointer APIs
```

Use React Native-compatible patterns.

### 3D Component Isolation

All 3D logic must live in dedicated components.

Recommended structure:

```txt
src/components/player/three/
  MusicSceneCanvas.tsx
  VinylDisc.tsx
  SceneLighting.tsx
  ThemeEnvironment.tsx
```

Do not mix 3D mesh logic directly inside `PlayerScreen`.

---

## 14. 3D Performance Rules

Mobile performance is a priority.

When adding 3D assets:

- Keep geometry low-poly when possible.
- Avoid unnecessary real-time shadows.
- Use compressed or optimized assets.
- Dispose of geometries and materials when needed.
- Avoid loading large 3D assets on initial app launch.
- Lazy-load the 3D player scene.
- Always provide a non-3D fallback.
- Avoid always-on high-cost rendering.

### 3D Lifecycle Rules

Any 3D component must:

- Unload unused resources.
- Avoid continuous rendering when not necessary.
- Stop animations when the player screen is not focused.
- Respect app lifecycle changes.
- Avoid memory leaks from retained materials, textures, or animation loops.

---

## 15. Navigation Rules

Use a clean navigation structure.

Suggested navigation groups:

```txt
AuthStack
MainTabs
PlayerStack
ThemeStack
```

Suggested screens:

```txt
LoginScreen
SignupScreen
HomeScreen
PlayerScreen
ThemeCustomizationScreen
LibraryScreen
SettingsScreen
```

Do not create navigation logic inside individual reusable components.

---

## 16. State Management Rules

Recommended stores:

```txt
authStore
themeStore
playerStore
```

### Auth Store

Should manage:

- Current user
- Loading state
- Auth errors
- Auth listener state

### Theme Store

Should manage:

- Current accent preset
- Custom accent values
- Theme mode
- Theme reset

### Player Store

Should manage:

- Current track
- Playback state
- Queue state
- Progress
- Repeat state
- Shuffle state

Do not overuse global state. Keep local UI-only state inside components.

---

## 17. Feature Development Workflow

When adding a new feature to Melodisc, follow this workflow:

### Step 1: Understand the Feature

Before writing code, identify:

- User goal
- Screen affected
- State needed
- Firebase needed or not
- Theme impact
- Animation impact
- Navigation impact
- 3D impact, if any

### Step 2: Update Design or Architecture Notes

If the feature changes UI behavior, update `DESIGN.md`.

If the feature changes architecture rules, update `AGENT.md`.

### Step 3: Define Types

Create or update TypeScript types before implementation.

Recommended location:

```txt
src/types/
```

### Step 4: Build Service Layer

If Firebase is needed, create or update the service function first.

Do not place Firebase logic directly in screens.

### Step 5: Build State Layer

If global state is needed, update the appropriate Zustand store.

### Step 6: Build UI Components

Create reusable components before screen composition.

### Step 7: Compose Screen

Use reusable components to build the full screen.

### Step 8: Add Animation Carefully

Only add animation after the screen works.

All animations must include lifecycle cleanup.

### Step 9: Test Manually

Check:

- Small phone layout
- Large phone layout
- Dark theme readability
- Theme switching
- Firebase error states
- Loading states
- Animation cleanup
- Navigation behavior
- Offline theme behavior

### Step 10: Refactor

Before finalizing, remove:

- Duplicate styles
- Hardcoded colors
- Unused imports
- Mixed Firebase/UI logic
- Overly complex code
- Temporary debug code
- Unused animation instances

---

## 18. Code Quality Rules

### General Rules

- Use TypeScript when possible.
- Use clear file names.
- Use small focused components.
- Avoid giant screen files.
- Avoid deeply nested inline styling.
- Keep business logic out of JSX.
- Prefer reusable hooks for repeated logic.
- Use meaningful variable names.
- Keep code readable for future student developers.

### Error Handling

Every async operation must handle errors.

For Firebase operations, return clear success or failure states.

Do not silently fail.

---

## 19. Styling Rules

Use centralized design tokens from the theme system.

Preferred pattern:

```txt
theme/colors.ts
theme/spacing.ts
theme/typography.ts
theme/radius.ts
theme/shadows.ts
```

Avoid large unstructured style objects directly inside screens.

If a component has styles, keep them readable and theme-based.

---

## 20. Accessibility Rules

All interactive controls must include accessibility support.

Required:

- Accessible labels for icon buttons
- Minimum touch targets
- High text contrast
- Clear error messages
- Readable form labels
- No color-only status indicators
- Clearly visible selected and disabled states

Example:

```txt
Play button must have an accessibility label such as "Play current song" or "Pause current song".
```

---

## 21. What Not To Do

Do not:

- Use CDNs.
- Generate web-only code.
- Put Firebase calls inside UI components.
- Hardcode theme colors.
- Build the 3D scene directly inside PlayerScreen.
- Add infinite animations without cleanup.
- Create large unoptimized 3D scenes.
- Ignore loading and error states.
- Overcrowd the interface.
- Add unrelated features.
- Rewrite the architecture without reason.
- Use placeholder logic as if it were production-ready.
- Ignore mobile performance constraints.

---

## 22. AI Assistant Behavior Rules

When assisting with this repository:

1. Follow `DESIGN.md` for UI and UX decisions.
2. Follow `AGENT.md` for architecture and technical decisions.
3. Do not write app code unless specifically asked.
4. When writing code, keep it React Native-compatible.
5. Use npm-based dependency installation only.
6. Explain architecture decisions briefly.
7. Prefer clean, beginner-readable code when requested.
8. Avoid making the app look overly AI-generated.
9. Keep Melodisc’s identity consistent.
10. Preserve future support for 3D player visuals and theme customization.
11. Do not add unrelated features without permission.
12. Keep Firebase, UI, state, and animation concerns separated.

---

## 23. Final Implementation Principle

Every new feature should make Melodisc feel more polished, more immersive, and more maintainable.

The app should remain:

```txt
dark
clean
themeable
music-focused
animation-ready
3D-ready
mobile-first
Firebase-ready
```
