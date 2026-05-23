import React, { useEffect, useRef } from 'react';
import {
  Image,
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
import { animate, type JSAnimation } from 'animejs';

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
  const discRef = useRef<View>(null);
  const pulseAnimRef = useRef<JSAnimation | null>(null);

  // Antigravity Pulse: animejs breathing animation on the disc
  useEffect(() => {
    const discElement = discRef.current;

    if (!discElement) {
      return undefined;
    }

    if (isPlaying) {
      pulseAnimRef.current = animate(discElement, {
        scale: [1.0, 1.05],
        duration: 1200,
        ease: 'inOutSine',
        alternate: true,
        loop: true,
      });
    } else {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.pause();
        pulseAnimRef.current = null;
      }

      // Reset scale
      animate(discElement, {
        scale: 1.0,
        duration: 300,
        ease: 'outQuad',
      });
    }

    return () => {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.pause();
        pulseAnimRef.current = null;
      }
    };
  }, [isPlaying]);

  const artworkSource = currentTrack
    ? resolveArtworkSource(currentTrack.id, currentTrack.artwork)
    : null;

  return (
    <View style={styles.screen}>
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

        {/* Visual stage – artwork or accent disc with animejs pulse */}
        <View style={[styles.visualStage, { borderColor: `${primaryAccent}33` }]}>
          <View
            ref={discRef}
            style={[styles.glowRing, { shadowColor: primaryAccent }]}
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
          </View>
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
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: primaryAccent,
                      width: `${progress * 100}%`,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressThumb,
                    {
                      backgroundColor: primaryAccent,
                      left: `${progress * 100}%`,
                    },
                  ]}
                />
              </View>
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
    height: 4,
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
    marginTop: -4,
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
