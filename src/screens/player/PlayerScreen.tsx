import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronDown,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from 'lucide-react-native';

import { artworkAssets } from '../../constants/assetRegistry';
import { usePlayerStore } from '../../store/playerStore';
import { useThemeStore } from '../../store/themeStore';
import { webGlassStyle } from '../../theme/glassStyles';

type PlayerScreenProps = {
  onBackHome: () => void;
};

function formatTime(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/** Resolve the image source for the current track, platform-conditionally. */
function resolveArtworkSource(trackId: string, webUri: string) {
  if (Platform.OS !== 'web') {
    const nativeAsset = artworkAssets[trackId];
    if (nativeAsset) {
      return nativeAsset as number;
    }
  }
  return { uri: webUri };
}

export function PlayerScreen({ onBackHome }: PlayerScreenProps) {
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const progress = usePlayerStore(state => state.progress);
  const currentTime = usePlayerStore(state => state.currentTime);
  const duration = usePlayerStore(state => state.duration);
  const nextTrack = usePlayerStore(state => state.nextTrack);
  const previousTrack = usePlayerStore(state => state.previousTrack);
  const togglePlay = usePlayerStore(state => state.togglePlay);
  const seek = usePlayerStore(state => state.seek);
  const pulseAnim = useRef(new Animated.Value(1.0)).current;

  const [trackWidth, setTrackWidth] = React.useState(0);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Trigger if swiping down vertically (ignoring minor horizontal jitter)
        return gestureState.dy > 10 && Math.abs(gestureState.dx) < 30;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 70) {
          onBackHome();
        }
      },
    })
  ).current;

  const handleLayout = (event: any) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const handleProgressPress = (event: any) => {
    if (trackWidth <= 0) return;

    let clickX = event.nativeEvent.locationX;

    // Web Fallback: React Native Web standard clicks don't map locationX directly inside touch events.
    if (clickX === undefined || isNaN(clickX)) {
      if (Platform.OS === 'web') {
        const rect = (event.currentTarget as any)?.getBoundingClientRect();
        if (rect) {
          clickX = (event.nativeEvent as any).clientX - rect.left;
        }
      }
    }

    if (clickX === undefined || isNaN(clickX)) return;

    const progressPercent = Math.min(1, Math.max(0, clickX / trackWidth));
    seek(progressPercent);
  };

  // Antigravity Pulse: hardware-accelerated native Animated breathing animation on the disc
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (isPlaying) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      // Reset scale back to 1.0
      Animated.timing(pulseAnim, {
        toValue: 1.0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isPlaying, pulseAnim]);

  const artworkSource = currentTrack
    ? resolveArtworkSource(currentTrack.id, currentTrack.artwork)
    : null;

  return (
    <View style={styles.screen} {...panResponder.panHandlers}>
      <View style={[styles.playerCard, webGlassStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={onBackHome}
            style={styles.backButton}
          >
            <ChevronDown color="#FFFFFF" size={28} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerLabel}>Now Playing</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Visual stage – artwork or accent disc with pulse */}
        <View style={[styles.visualStage, { borderColor: `${primaryAccent}33` }]}>
          <Animated.View
            style={[
              styles.glowRing,
              {
                shadowColor: primaryAccent,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {artworkSource ? (
              <Image
                source={artworkSource}
                style={styles.artworkImage}
              />
            ) : (
              <View style={[styles.disc, { backgroundColor: primaryAccent }]}>
                <View style={styles.discHole} />
              </View>
            )}
          </Animated.View>
        </View>

        {currentTrack ? (
          <>
            {/* Track info */}
            <View style={styles.trackInfoSection}>
              <Text numberOfLines={2} style={styles.title}>
                {currentTrack.title}
              </Text>
              <Text numberOfLines={1} style={styles.artist}>
                {currentTrack.artist}
              </Text>
              <Text style={[styles.genre, { color: primaryAccent }]}>
                {currentTrack.genre}
              </Text>
            </View>

            {/* Progress bar with time labels */}
            <View style={styles.progressSection}>
              <TouchableOpacity
                activeOpacity={1}
                onLayout={handleLayout}
                onPress={handleProgressPress}
                style={styles.progressTrack}
              >
                <View
                  pointerEvents="none"
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: primaryAccent,
                      width: `${progress * 100}%`,
                    },
                  ]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.progressThumb,
                    {
                      backgroundColor: primaryAccent,
                      left: `${progress * 100}%`,
                    },
                  ]}
                />
              </TouchableOpacity>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeLabel}>{formatTime(duration)}</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.trackInfoSection}>
            <Text style={styles.title}>Pick a song from Home</Text>
            <Text style={styles.artist}>
              Your selected track will appear here.
            </Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={previousTrack}
            style={styles.controlButton}
          >
            <SkipBack color="#FFFFFF" fill="#FFFFFF" size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={togglePlay}
            style={[styles.playButton, { backgroundColor: primaryAccent }]}
          >
            {isPlaying ? (
              <Pause color="#000000" fill="#000000" size={28} />
            ) : (
              <Play color="#000000" fill="#000000" size={28} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={nextTrack}
            style={styles.controlButton}
          >
            <SkipForward color="#FFFFFF" fill="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  playerCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 28,
    borderWidth: 1,
    maxWidth: 440,
    padding: 24,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    width: '100%',
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerLabel: {
    color: '#B3B3B3',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 44,
  },
  visualStage: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    marginVertical: 16,
    overflow: 'hidden',
    width: '100%',
  },
  glowRing: {
    alignItems: 'center',
    borderRadius: 20,
    height: '80%',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    width: '80%',
  },
  artworkImage: {
    borderRadius: 16,
    height: '100%',
    width: '100%',
  },
  disc: {
    alignItems: 'center',
    borderRadius: 999,
    height: 120,
    justifyContent: 'center',
    opacity: 0.9,
    width: 120,
  },
  discHole: {
    backgroundColor: '#000000',
    borderRadius: 999,
    height: 20,
    width: 20,
  },
  trackInfoSection: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    textAlign: 'center',
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  genre: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  progressSection: {
    marginTop: 24,
    width: '100%',
  },
  progressTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 999,
    height: 6,
    overflow: 'visible',
    position: 'relative',
    width: '100%',
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
  },
  progressThumb: {
    borderRadius: 999,
    height: 12,
    marginLeft: -6,
    marginTop: -3,
    position: 'absolute',
    top: 0,
    width: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeLabel: {
    color: '#77777D',
    fontSize: 12,
    fontWeight: '600',
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    marginTop: 28,
    width: '100%',
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  playButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
});
