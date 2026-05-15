import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { tracks, type Track } from '../constants/tracks';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useThemeStore } from '../store/themeStore';
import { activeGlow, webGlassStyle } from '../theme/glassStyles';

type HomeScreenProps = {
  onOpenPlayer: () => void;
  onRequestAddToPlaylist: (track: Track) => void;
};

const jumpBackInTracks = tracks.slice(0, 6);

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  }

  if (hour >= 12 && hour < 18) {
    return 'Good Afternoon';
  }

  return 'Good Evening';
}

export function HomeScreen({
  onOpenPlayer,
  onRequestAddToPlaylist,
}: HomeScreenProps) {
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const displayName = useThemeStore(state => state.displayName);
  const user = useAuthStore(state => state.user);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const playTrack = usePlayerStore(state => state.playTrack);

  const userName =
    displayName || user?.displayName || user?.email || 'Listener';
  const avatarLetter = userName.charAt(0).toUpperCase();

  const handleTrackPress = (track: Track) => {
    playTrack(track);
    onOpenPlayer();
  };

  const handleAddTrack = (event: GestureResponderEvent, track: Track) => {
    event.stopPropagation();
    onRequestAddToPlaylist(track);
  };

  const renderTrackRow = (track: Track, index: number) => {
    const isActive = currentTrack?.id === track.id;

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        key={track.id}
        onPress={() => handleTrackPress(track)}
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
          source={{ uri: track.artwork }}
          style={[
            styles.trackThumb,
            isActive && { borderColor: primaryAccent, borderWidth: 2 },
          ]}
        />

        <View style={styles.trackInfo}>
          <Text numberOfLines={1} style={styles.trackTitle}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={styles.trackArtist}>
            {track.artist}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          style={[styles.genre, { color: primaryAccent }]}
        >
          {track.genre}
        </Text>

        <TouchableOpacity
          activeOpacity={0.76}
          onPress={event => handleAddTrack(event, track)}
          style={[styles.addButton, { borderColor: primaryAccent }]}
        >
          <Text style={[styles.addButtonText, { color: primaryAccent }]}>
            +
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with greeting + avatar */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={[styles.eyebrow, { color: primaryAccent }]}>
                Melodisc
              </Text>
              <Text style={styles.title}>{getGreeting()}</Text>
            </View>
            <View style={[styles.avatar, { backgroundColor: primaryAccent }]}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            {user?.email ?? 'Signed in'} — keep the music moving
          </Text>
        </View>

        {/* Jump Back In – 2-column grid */}
        <Text style={styles.sectionTitle}>Jump Back In</Text>
        <View style={styles.jumpGrid}>
          {jumpBackInTracks.map(track => {
            const isActive = currentTrack?.id === track.id;

            return (
              <TouchableOpacity
                activeOpacity={0.84}
                key={track.id}
                onPress={() => handleTrackPress(track)}
                style={[
                  styles.jumpCard,
                  webGlassStyle,
                  isActive && {
                    borderColor: primaryAccent,
                    boxShadow: activeGlow(primaryAccent),
                  },
                ]}
              >
                <Image
                  source={{ uri: track.artwork }}
                  style={styles.jumpArtwork}
                />
                <View style={styles.jumpInfo}>
                  <Text numberOfLines={1} style={styles.jumpTitle}>
                    {track.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.jumpGenre, { color: primaryAccent }]}
                  >
                    {track.genre}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* All Tracks */}
        <Text style={styles.sectionTitle}>All Tracks</Text>
        <View style={styles.trackList}>
          {tracks.map((track, index) => renderTrackRow(track, index))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000000',
    flex: 1,
    height: '100%',
    paddingHorizontal: 20,
    paddingTop: 24,
    width: '100%',
  },
  content: {
    gap: 14,
    paddingBottom: 180,
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
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 10,
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
