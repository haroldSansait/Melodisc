import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  type PanResponderGestureState,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';

import { TurntableDeck } from '../components/turntable/TurntableDeck';
import { artworkAssets } from '../constants/assetRegistry';
import { tracks, type Track } from '../constants/tracks';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useThemeStore } from '../store/themeStore';
import { activeGlow, webGlassStyle, webGlassStyleStrong } from '../theme/glassStyles';

type HomeScreenProps = {
  onOpenPlayer: () => void;
  onRequestAddToPlaylist: (track: Track) => void;
};

const ENVIRONMENT_THEMES = [
  { id: 'default' as const, label: 'Rainy Lo-Fi' },
  { id: 'warm_vibe' as const, label: 'Golden Hour' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function HomeScreen({
  onOpenPlayer,
  onRequestAddToPlaylist,
}: HomeScreenProps) {
  const { height: screenHeight } = useWindowDimensions();
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const displayName = useThemeStore(state => state.displayName);
  const user = useAuthStore(state => state.user);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const playTrack = usePlayerStore(state => state.playTrack);
  const recentTracks = usePlayerStore(state => state.recentTracks);
  const environmentTheme = useThemeStore(state => state.environmentTheme);
  const setEnvironmentTheme = useThemeStore(state => state.setEnvironmentTheme);

  // Scene cross-fade opacity
  const sceneOpacity = useRef(new Animated.Value(1)).current;

  const userName =
    displayName || user?.displayName || user?.email || 'Listener';
  const avatarLetter = userName.charAt(0).toUpperCase();

  // ── Turntable state ──
  const [dockingTrack, setDockingTrack] = useState<Track | null>(null);

  // ── Drawer state ──
  const [isTopOpen, setIsTopOpen] = useState(false);

  const topDrawerAnim = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const DRAWER_HEIGHT = Math.min(screenHeight * 0.75, 700);

  const toggleTopDrawer = useCallback(() => {
    const toValue = isTopOpen ? 0 : 1;
    setIsTopOpen(!isTopOpen);

    Animated.parallel([
      Animated.timing(topDrawerAnim, {
        toValue,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isTopOpen, topDrawerAnim, backdropOpacity]);

  const closeDrawers = useCallback(() => {
    setIsTopOpen(false);

    Animated.parallel([
      Animated.timing(topDrawerAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [topDrawerAnim, backdropOpacity]);

  // Ref to prevent stale closures in PanResponder callbacks
  const stateRef = useRef({ isTopOpen, toggleTopDrawer });
  useEffect(() => {
    stateRef.current = { isTopOpen, toggleTopDrawer };
  }, [isTopOpen, toggleTopDrawer]);

  const topHandlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_: any, gestureState: PanResponderGestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderRelease: (_: any, gestureState: PanResponderGestureState) => {
        const { isTopOpen: latestIsTopOpen, toggleTopDrawer: latestToggleTopDrawer } = stateRef.current;
        if (!latestIsTopOpen && gestureState.dy > 15) {
          latestToggleTopDrawer();
        } else if (latestIsTopOpen && gestureState.dy < -15) {
          latestToggleTopDrawer();
        }
      },
    })
  ).current;

  // Capture card tap and trigger fly-and-dock
  const handleTrackPress = useCallback(
    (track: Track, _event: GestureResponderEvent) => {
      closeDrawers();
      setDockingTrack({ ...track });
    },
    [closeDrawers],
  );

  const handleDockComplete = useCallback(
    (track: Track) => {
      const current = usePlayerStore.getState().currentTrack;
      if (current?.id !== track.id) {
        playTrack(track);
      }
      setDockingTrack(null);
    },
    [playTrack],
  );

  const handleVinylTap = useCallback(() => {
    onOpenPlayer();
  }, [onOpenPlayer]);

  // Theme cycling with cross-fade
  const cycleTheme = useCallback((direction: 1 | -1) => {
    const currentIndex = ENVIRONMENT_THEMES.findIndex(t => t.id === environmentTheme);
    const nextIndex = (currentIndex + direction + ENVIRONMENT_THEMES.length) % ENVIRONMENT_THEMES.length;
    const nextTheme = ENVIRONMENT_THEMES[nextIndex];

    Animated.timing(sceneOpacity, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setEnvironmentTheme(nextTheme.id);
      Animated.timing(sceneOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [environmentTheme, sceneOpacity, setEnvironmentTheme]);

  const currentThemeLabel = ENVIRONMENT_THEMES.find(t => t.id === environmentTheme)?.label ?? 'Default Room';

  const statusBarHeight = Platform.select({
    android: StatusBar.currentHeight || 0,
    ios: 44,
    default: 0,
  });

  const topTranslateY = topDrawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_HEIGHT + statusBarHeight, statusBarHeight],
  });

  return (
    <View style={styles.screen}>

      {/* Focal Center: 3D Turntable */}
      <Animated.View style={[styles.turntableWrap, { opacity: sceneOpacity }]}>
        <TurntableDeck
          dockingTrack={dockingTrack}
          onDockComplete={handleDockComplete}
          onVinylTap={handleVinylTap}
        />
      </Animated.View>

      {/* Backdrop for closing drawers */}
      <TouchableWithoutFeedback onPress={closeDrawers}>
        <Animated.View
          pointerEvents={isTopOpen ? 'auto' : 'none'}
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
      </TouchableWithoutFeedback>

      {/* ── Top Drawer ("Jump Back In") ── */}
      <Animated.View
        style={[
          styles.drawerTop,
          webGlassStyleStrong,
          { height: DRAWER_HEIGHT, transform: [{ translateY: topTranslateY }] },
        ]}
      >
        <ScrollView contentContainerStyle={styles.drawerContent} showsVerticalScrollIndicator={false}>
          {/* Header with greeting + avatar */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text style={[styles.eyebrow, { color: primaryAccent }]}>Melodisc</Text>
                <Text style={styles.title}>{getGreeting()}</Text>
              </View>
              <View style={[styles.avatar, { backgroundColor: primaryAccent }]}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>{user?.email ?? 'Signed in'} — keep the music moving</Text>
          </View>

          <View style={styles.jumpGrid}>
            {(recentTracks.length > 0 ? recentTracks : tracks.slice(0, 6)).map(track => {
              const isActive = currentTrack?.id === track.id;
              return (
                <TouchableOpacity
                  activeOpacity={0.84}
                  key={track.id}
                  onPress={event => handleTrackPress(track, event)}
                  style={[
                    styles.jumpCard,
                    webGlassStyle,
                    isActive && { borderColor: primaryAccent, boxShadow: activeGlow(primaryAccent) },
                  ]}
                >
                  <Image source={
                    Platform.OS !== 'web' && artworkAssets[track.id]
                      ? artworkAssets[track.id]
                      : { uri: track.artwork }
                  } style={styles.jumpArtwork} />
                  <View style={styles.jumpInfo}>
                    <Text numberOfLines={1} style={styles.jumpTitle}>{track.title}</Text>
                    <Text numberOfLines={1} style={[styles.jumpGenre, { color: primaryAccent }]}>{track.genre}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Top Controls Container */}
        <View style={styles.topControlsContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleTopDrawer}
            style={styles.drawerHandleBottom}
            {...topHandlePanResponder.panHandlers}
          >
            <Text style={styles.drawerHandleText}>Jump Back In</Text>
            <ChevronDown color="#FFFFFF" size={20} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.themeSwitcher}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => cycleTheme(-1)} style={styles.themeArrow}>
              <ChevronLeft color="#FFFFFF" size={16} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.themeLabel}>{currentThemeLabel}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => cycleTheme(1)} style={styles.themeArrow}>
              <ChevronRight color="#FFFFFF" size={16} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000000',
    flex: 1,
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  turntableWrap: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  drawerTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(18, 18, 22, 0.92)',
  },
  drawerContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 14,
  },
  topControlsContainer: {
    position: 'absolute',
    bottom: -40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  drawerHandleBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(25, 25, 30, 0.9)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  drawerHandleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  themeSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 25, 30, 0.9)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  themeArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  themeLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    minWidth: 80,
    textAlign: 'center',
  },
  header: {
    marginBottom: 8,
    width: '100%',
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    marginLeft: 14,
    width: 44,
  },
  avatarText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 36,
  },
  subtitle: {
    color: '#B3B3B3',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  jumpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  jumpCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 68,
    overflow: 'hidden',
    padding: 0,
    width: '48.5%',
    marginBottom: 10,
  },
  jumpArtwork: {
    borderRadius: 0,
    height: 68,
    width: 68,
  },
  jumpInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  jumpTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  jumpGenre: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
});
