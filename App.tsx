import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Home, Library, Search, User } from 'lucide-react-native';

import { MiniPlayer } from './src/components/player/MiniPlayer';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignupScreen } from './src/screens/auth/SignupScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { PlayerScreen } from './src/screens/player/PlayerScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import type { Track } from './src/constants/tracks';
import { subscribeToAuthChanges } from './src/services/firebase/authService';
import { useAuthStore } from './src/store/authStore';
import { usePlayerStore } from './src/store/playerStore';
import { usePlaylistStore } from './src/store/playlistStore';
import { useThemeStore } from './src/store/themeStore';
import {
  webBlurLayerStyle,
  webGlassStyle,
  webGlassStyleStrong,
} from './src/theme/glassStyles';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type AuthView = 'login' | 'signup';
type AppTab = 'Home' | 'Search' | 'Library' | 'Profile';

const TAB_CONFIG: { key: AppTab; icon: typeof Home }[] = [
  { key: 'Home', icon: Home },
  { key: 'Search', icon: Search },
  { key: 'Library', icon: Library },
  { key: 'Profile', icon: User },
];

// ── Glass Spinner ──
function GlassSpinner() {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const primaryAccent = useThemeStore(state => state.primaryAccent);

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      }),
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    spin.start();
    pulse.start();

    return () => {
      spin.stop();
      pulse.stop();
    };
  }, [spinAnim, pulseAnim]);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={spinnerStyles.container}>
      <View style={[spinnerStyles.card, webGlassStyle]}>
        <Animated.View
          style={[
            spinnerStyles.ring,
            {
              borderColor: primaryAccent,
              opacity: pulseAnim,
              transform: [{ rotate: spinInterpolate }],
            },
          ]}
        />
        <Text style={spinnerStyles.text}>Loading Melodisc...</Text>
      </View>
    </View>
  );
}

const spinnerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#000000',
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 20,
    padding: 40,
  },
  ring: {
    borderRadius: 999,
    borderWidth: 3,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
    height: 48,
    width: 48,
  },
  text: {
    color: '#B3B3B3',
    fontSize: 14,
    fontWeight: '700',
  },
});

// ── Main App ──
function AppContent() {
  const [authView, setAuthView] = useState<AuthView>('login');
  const [currentTab, setCurrentTab] = useState<AppTab>('Home');
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(
    null,
  );
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const { height: windowHeight } = useWindowDimensions();
  const user = useAuthStore(state => state.user);
  const isInitialLoading = useAuthStore(state => state.isInitialLoading);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const isHydrated = useThemeStore(state => state.isHydrated);
  const playlists = usePlaylistStore(state => state.playlists);
  const isPlaylistsLoaded = usePlaylistStore(state => state.isLoaded);
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 0);
  const playerSlide = useRef(new Animated.Value(0)).current;
  const playerBackdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return subscribeToAuthChanges();
  }, []);

  // Hydration: theme + playlists from Firestore on login
  useEffect(() => {
    if (!user) {
      useThemeStore.getState().resetHydration();
      usePlaylistStore.getState().reset();
      setCurrentTab('Home');
      setIsPlayerVisible(false);
      setPlaylistModalTrack(null);
      setNewPlaylistName('');
      return undefined;
    }

    // Hydrate theme from Firestore
    useThemeStore.getState().hydrateFromFirestore(user.uid);

    // Subscribe to playlists (real-time)
    const unsubPlaylists = usePlaylistStore
      .getState()
      .subscribeToUserPlaylists(user.uid);

    return () => {
      unsubPlaylists();
    };
  }, [user]);

  // Player slide animation
  useEffect(() => {
    if (!user || !isPlayerVisible) {
      return undefined;
    }

    const animation = Animated.timing(playerSlide, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    });
    const backdropAnimation = Animated.timing(playerBackdropOpacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    });

    animation.start();
    backdropAnimation.start();

    return () => {
      animation.stop();
      backdropAnimation.stop();
    };
  }, [isPlayerVisible, playerBackdropOpacity, playerSlide, user]);

  const openPlayer = () => {
    playerSlide.setValue(0);
    playerBackdropOpacity.setValue(0);
    setIsPlayerVisible(true);
  };

  const closePlayer = () => {
    Animated.parallel([
      Animated.timing(playerSlide, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.timing(playerBackdropOpacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsPlayerVisible(false);
      }
    });
  };

  const closePlaylistModal = () => {
    setPlaylistModalTrack(null);
    setNewPlaylistName('');
  };

  const handleAddToPlaylist = (playlistId: string) => {
    if (!playlistModalTrack || !user) {
      return;
    }

    usePlaylistStore
      .getState()
      .addTrackToPlaylist(user.uid, playlistModalTrack.id, playlistId);
    closePlaylistModal();
  };

  const handleCreatePlaylist = async () => {
    if (!playlistModalTrack || !user) {
      return;
    }

    const playlistId = await usePlaylistStore
      .getState()
      .createPlaylist(user.uid, newPlaylistName);

    usePlaylistStore
      .getState()
      .addTrackToPlaylist(user.uid, playlistModalTrack.id, playlistId);
    closePlaylistModal();
  };

  const renderCurrentTab = () => {
    if (currentTab === 'Search') {
      return (
        <SearchScreen
          onOpenPlayer={openPlayer}
          onRequestAddToPlaylist={setPlaylistModalTrack}
        />
      );
    }

    if (currentTab === 'Library') {
      return <LibraryScreen />;
    }

    if (currentTab === 'Profile') {
      return <ProfileScreen />;
    }

    return (
      <HomeScreen
        onOpenPlayer={openPlayer}
        onRequestAddToPlaylist={setPlaylistModalTrack}
      />
    );
  };

  const playerOverlayAnimatedStyle = {
    transform: [
      {
        translateY: playerSlide.interpolate({
          inputRange: [0, 1],
          outputRange: [windowHeight, 0],
        }),
      },
    ],
  };

  // ── Loading (auth or hydration) ──
  if (isInitialLoading) {
    return <GlassSpinner />;
  }

  // ── Authenticated App Shell ──
  if (user) {
    // Show spinner while Firestore hydration is in progress
    if (!isHydrated || !isPlaylistsLoaded) {
      return <GlassSpinner />;
    }

    return (
      <View style={styles.appShell}>
        {/* Layer 0 – Current Screen */}
        <View style={styles.screenLayer}>{renderCurrentTab()}</View>

        {/* Layer 1 – MiniPlayer (floating above nav) */}
        {currentTrack ? <MiniPlayer onOpenPlayer={openPlayer} /> : null}

        {/* Layer 2 – Bottom Navigation */}
        <View
          style={[
            styles.bottomNav,
            webGlassStyle,
            {
              minHeight: 70 + bottomInset,
              paddingBottom: 8 + bottomInset,
            },
          ]}
        >
          {TAB_CONFIG.map(({ key, icon: Icon }) => {
            const isActive = key === currentTab;
            const iconColor = isActive ? primaryAccent : '#B3B3B3';

            return (
              <TouchableOpacity
                activeOpacity={0.82}
                key={key}
                onPress={() => setCurrentTab(key)}
                style={[
                  styles.navButton,
                  isActive && { backgroundColor: `${primaryAccent}18` },
                ]}
              >
                <Icon color={iconColor} size={22} strokeWidth={2.2} />
                <Text
                  numberOfLines={1}
                  style={[styles.navLabel, { color: iconColor }]}
                >
                  {key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Playlist Modal */}
        <Modal
          animationType="fade"
          onRequestClose={closePlaylistModal}
          transparent
          visible={playlistModalTrack !== null}
        >
          <View style={styles.modalScrim}>
            <View style={[styles.playlistModal, webGlassStyleStrong]}>
              <Text style={styles.modalTitle}>Add to Playlist</Text>
              <Text numberOfLines={1} style={styles.modalTrackTitle}>
                {playlistModalTrack?.title}
              </Text>

              <View style={styles.modalPlaylistList}>
                {playlists.map(playlist => (
                  <TouchableOpacity
                    activeOpacity={0.82}
                    key={playlist.id}
                    onPress={() => handleAddToPlaylist(playlist.id)}
                    style={styles.modalPlaylistButton}
                  >
                    <Text style={styles.modalPlaylistName}>
                      {playlist.name}
                    </Text>
                    <Text style={styles.modalPlaylistMeta}>
                      {playlist.trackIds.length} tracks
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                onChangeText={setNewPlaylistName}
                placeholder="New playlist name"
                placeholderTextColor="#77777D"
                style={styles.modalInput}
                value={newPlaylistName}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={closePlaylistModal}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={handleCreatePlaylist}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: primaryAccent },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Layer 3 – Full Player Overlay */}
        {isPlayerVisible ? (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.playerBackdrop,
                webBlurLayerStyle,
                { opacity: playerBackdropOpacity },
              ]}
            />
            <Animated.View
              style={[styles.playerOverlay, playerOverlayAnimatedStyle]}
            >
              <PlayerScreen onBackHome={closePlayer} />
            </Animated.View>
          </>
        ) : null}
      </View>
    );
  }

  // ── Auth Flow ──
  if (authView === 'signup') {
    return <SignupScreen onShowLogin={() => setAuthView('login')} />;
  }

  return <LoginScreen onShowSignup={() => setAuthView('signup')} />;
}

const styles = StyleSheet.create({
  appShell: {
    backgroundColor: '#000000',
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  screenLayer: {
    flex: 1,
    height: '100%',
    width: '100%',
    zIndex: 0,
  },
  bottomNav: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 14, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 0,
    minHeight: 70,
    paddingBottom: 8,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  navButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    minHeight: 54,
    minWidth: 0,
    paddingVertical: 6,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modalScrim: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  playlistModal: {
    backgroundColor: 'rgba(18, 18, 22, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 420,
    padding: 22,
    width: '100%',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  modalTrackTitle: {
    color: '#B3B3B3',
    fontSize: 14,
    marginTop: 6,
  },
  modalPlaylistList: {
    gap: 8,
    marginTop: 18,
  },
  modalPlaylistButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    minHeight: 56,
    padding: 14,
  },
  modalPlaylistName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalPlaylistMeta: {
    color: '#B3B3B3',
    fontSize: 12,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 15,
    marginTop: 14,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#18181D',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  playerOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 100,
  },
  playerBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 99,
  },
});

function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

export default App;
