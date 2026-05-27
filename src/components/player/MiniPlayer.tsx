import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Pause, Play } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { artworkAssets } from '../../constants/assetRegistry';
import { usePlayerStore } from '../../store/playerStore';
import { useThemeStore } from '../../store/themeStore';
import { webGlassStyle } from '../../theme/glassStyles';

type MiniPlayerProps = {
  onOpenPlayer: () => void;
};

export function MiniPlayer({ onOpenPlayer }: MiniPlayerProps) {
  const insets = useSafeAreaInsets();
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const progress = usePlayerStore(state => state.progress);
  const togglePlay = usePlayerStore(state => state.togglePlay);
  const seek = usePlayerStore(state => state.seek);

  const [trackWidth, setTrackWidth] = React.useState(0);

  if (!currentTrack) {
    return null;
  }

  const handleTogglePlay = (event: GestureResponderEvent) => {
    event.stopPropagation();
    togglePlay();
  };

  const handleLayout = (event: any) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const handleProgressPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
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

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onOpenPlayer}
      style={[
        styles.container,
        webGlassStyle,
        { bottom: 82 + Math.max(insets.bottom, 0) },
      ]}
    >
      {/* Album artwork thumbnail — native uses static require(), web uses URI */}
      {currentTrack.artwork ? (
        <Image
          source={
            Platform.OS !== 'web' && artworkAssets[currentTrack.id]
              ? artworkAssets[currentTrack.id]
              : { uri: currentTrack.artwork }
          }
          style={styles.thumbnail}
        />
      ) : (
        <View
          style={[styles.thumbnail, { backgroundColor: `${primaryAccent}33` }]}
        >
          <View
            style={[styles.thumbnailDisc, { backgroundColor: primaryAccent }]}
          />
        </View>
      )}

      <View style={styles.trackInfo}>
        <Text numberOfLines={1} style={styles.title}>
          {currentTrack.title}
        </Text>
        <Text numberOfLines={1} style={styles.artist}>
          {currentTrack.artist}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.82}
        onPress={handleTogglePlay}
        style={[styles.playButton, { backgroundColor: primaryAccent }]}
      >
        {isPlaying ? (
          <Pause color="#000000" fill="#000000" size={18} />
        ) : (
          <Play color="#000000" fill="#000000" size={18} />
        )}
      </TouchableOpacity>

      {/* Progress bar at the bottom edge */}
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
            { backgroundColor: primaryAccent, width: `${progress * 100}%` },
          ]}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    left: 12,
    minHeight: 68,
    overflow: 'hidden',
    padding: 10,
    position: 'absolute',
    right: 12,
    zIndex: 10,
  },
  thumbnail: {
    alignItems: 'center',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  thumbnailDisc: {
    borderRadius: 999,
    height: 24,
    width: 24,
  },
  trackInfo: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 3,
  },
  playButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  progressTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 999,
    bottom: 0,
    height: 6,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
  },
});
