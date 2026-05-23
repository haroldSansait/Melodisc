import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react-native';

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

function formatTime(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

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
  const currentTime = usePlayerStore(state => state.currentTime);
  const duration = usePlayerStore(state => state.duration);
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
  const [isBottomOpen, setIsBottomOpen] = useState(false);
  
  const topDrawerAnim = useRef(new Animated.Value(0)).current;
  const bottomDrawerAnim = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const DRAWER_HEIGHT = Math.min(screenHeight * 0.75, 700);

  const toggleTopDrawer = useCallback(() => {
    const toValue = isTopOpen ? 0 : 1;
    setIsTopOpen(!isTopOpen);
    
    if (!isTopOpen && isBottomOpen) {
      setIsBottomOpen(false);
      Animated.timing(bottomDrawerAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }

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
      })
    ]).start();
  }, [isTopOpen, isBottomOpen, topDrawerAnim, bottomDrawerAnim, backdropOpacity]);

  const toggleBottomDrawer = useCallback(() => {
    const toValue = isBottomOpen ? 0 : 1;
    setIsBottomOpen(!isBottomOpen);

    if (!isBottomOpen && isTopOpen) {
      setIsTopOpen(false);
      Animated.timing(topDrawerAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }

    Animated.parallel([
      Animated.timing(bottomDrawerAnim, {
        toValue,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, [isBottomOpen, isTopOpen, bottomDrawerAnim, topDrawerAnim, backdropOpacity]);

  const closeDrawers = useCallback(() => {
    setIsTopOpen(false);
    setIsBottomOpen(false);
    
    Animated.parallel([
      Animated.timing(topDrawerAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(bottomDrawerAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();
  }, [topDrawerAnim, bottomDrawerAnim, backdropOpacity]);

  // Capture card tap and trigger fly-and-dock
  const handleTrackPress = useCallback(
    (track: Track, event: GestureResponderEvent) => {
      closeDrawers(); // Automatically close drawers to reveal Turntable
      setDockingTrack({ ...track });
    },
    [closeDrawers],
  );

  const handleDockComplete = useCallback(
    (track: Track) => {
      playTrack(track);
      setDockingTrack(null);
    },
    [playTrack],
  );

  const handleVinylTap = useCallback(() => {
    onOpenPlayer();
  }, [onOpenPlayer]);

  const handleAddTrack = (event: GestureResponderEvent, track: Track) => {
    event.stopPropagation();
    onRequestAddToPlaylist(track);
  };

  // Theme cycling with cross-fade
  const cycleTheme = useCallback((direction: 1 | -1) => {
    const currentIndex = ENVIRONMENT_THEMES.findIndex(t => t.id === environmentTheme);
    const nextIndex = (currentIndex + direction + ENVIRONMENT_THEMES.length) % ENVIRONMENT_THEMES.length;
    const nextTheme = ENVIRONMENT_THEMES[nextIndex];

    // Fade out
    Animated.timing(sceneOpacity, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      // Switch theme at the opacity trough
      setEnvironmentTheme(nextTheme.id);
      // Fade in
      Animated.timing(sceneOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [environmentTheme, sceneOpacity, setEnvironmentTheme]);

  const currentThemeLabel = ENVIRONMENT_THEMES.find(t => t.id === environmentTheme)?.label ?? 'Default Room';

  const renderTrackRow = (track: Track) => {
    const isActive = currentTrack?.id === track.id;

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        key={track.id}
        onPress={event => handleTrackPress(track, event)}
        style={[
          styles.trackCard,
          webGlassStyle,
          isActive && {
            borderColor: primaryAccent,
            boxShadow: activeGlow(primaryAccent),
          },
        ]}
      >
        <Image
          source={
            Platform.OS !== 'web' && artworkAssets[track.id]
              ? artworkAssets[track.id]
              : { uri: track.artwork }
          }
          style={[
            styles.trackThumb,
            isActive && { borderColor: primaryAccent, borderWidth: 2 },
          ]}
        />
        <View style={styles.trackInfo}>
          <Text numberOfLines={1} style={styles.trackTitle}>{track.title}</Text>
          <Text numberOfLines={1} style={styles.trackArtist}>{track.artist}</Text>
        </View>
        <Text numberOfLines={1} style={[styles.genre, { color: primaryAccent }]}>{track.genre}</Text>
        <TouchableOpacity
          activeOpacity={0.76}
          onPress={event => handleAddTrack(event, track)}
          style={[styles.addButton, { borderColor: primaryAccent }]}
        >
          <Text style={[styles.addButtonText, { color: primaryAccent }]}>+</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const topTranslateY = topDrawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_HEIGHT, 0],
  });

  const bottomTranslateY = bottomDrawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [DRAWER_HEIGHT, 0],
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
          pointerEvents={(isTopOpen || isBottomOpen) ? 'auto' : 'none'}
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
      </TouchableWithoutFeedback>

      {/* ── Top Drawer ("Jump Back In") ── */}
      <Animated.View 
        style={[
          styles.drawerTop, 
          webGlassStyleStrong, 
          { height: DRAWER_HEIGHT, transform: [{ translateY: topTranslateY }] }
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
          <TouchableOpacity activeOpacity={0.8} onPress={toggleTopDrawer} style={styles.drawerHandleBottom}>
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

      {/* ── Bottom Drawer ("All Tracks") ── */}
      <Animated.View 
        style={[
          styles.drawerBottom, 
          webGlassStyleStrong, 
          { height: DRAWER_HEIGHT, transform: [{ translateY: bottomTranslateY }] }
        ]}
      >
        {/* Floating Toggle Arrow */}
        <TouchableOpacity activeOpacity={0.8} onPress={toggleBottomDrawer} style={styles.drawerHandleTop}>
          <ChevronUp color="#FFFFFF" size={20} strokeWidth={2.5} />
          <Text style={styles.drawerHandleText}>All Tracks</Text>
          {currentTrack && duration > 0 && (
            <View style={styles.durationPill}>
              <Text style={[styles.durationText, { color: primaryAccent }]}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.drawerContent} showsVerticalScrollIndicator={false}>
          <View style={styles.trackList}>
            {tracks.map(track => renderTrackRow(track))}
          </View>
        </ScrollView>
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
  drawerBottom: {
    position: 'absolute',
    bottom: 0, // Sits slightly above bottom nav usually, but absolute to viewport here
    left: 0,
    right: 0,
    zIndex: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(18, 18, 22, 0.92)',
    paddingBottom: 90, // Leave room for miniplayer and nav
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
  drawerHandleTop: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(25, 25, 30, 0.9)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
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
  durationPill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    gap: 10,
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
  trackList: {
    gap: 10,
  },
  trackCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
    padding: 12,
  },
  trackThumb: {
    borderRadius: 8,
    height: 48,
    width: 48,
  },
  trackInfo: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  trackArtist: {
    color: '#B3B3B3',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  genre: {
    fontSize: 11,
    fontWeight: '800',
    maxWidth: 100,
  },
  addButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
});
