import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ListMusic } from 'lucide-react-native';

import { usePlaylistStore } from '../store/playlistStore';
import { useThemeStore } from '../store/themeStore';
import { webGlassStyle } from '../theme/glassStyles';

export function LibraryScreen() {
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const playlists = usePlaylistStore(state => state.playlists);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Library</Text>

        {playlists.length === 0 ? (
          <View style={[styles.emptyCard, webGlassStyle]}>
            <ListMusic color="#77777D" size={40} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No playlists yet</Text>
            <Text style={styles.emptySubtitle}>
              Use the + button on any track to create your first playlist.
            </Text>
          </View>
        ) : null}

        <View style={styles.playlistList}>
          {playlists.map(playlist => (
            <View key={playlist.id} style={[styles.playlistCard, webGlassStyle]}>
              {/* Playlist icon */}
              <View style={styles.playlistHeader}>
                <View style={[styles.playlistIcon, { backgroundColor: `${primaryAccent}22` }]}>
                  <ListMusic color={primaryAccent} size={20} strokeWidth={2} />
                </View>
                <View style={styles.playlistHeaderText}>
                  <Text numberOfLines={1} style={styles.playlistName}>
                    {playlist.name}
                  </Text>
                  <Text style={styles.playlistMeta}>
                    {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
                  </Text>
                </View>
              </View>

              {playlist.tracks.length === 0 ? (
                <Text style={styles.emptyText}>
                  Add tracks with the + button on Home or Search.
                </Text>
              ) : (
                <View style={styles.savedTrackList}>
                  {playlist.tracks.map((track, index) => (
                    <View key={track.id} style={styles.savedTrackRow}>
                      <Text style={styles.savedTrackIndex}>
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                      <View style={styles.savedTrackInfo}>
                        <Text numberOfLines={1} style={styles.savedTrackTitle}>
                          {track.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.savedTrackArtist}>
                          {track.artist}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
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
    gap: 16,
    paddingBottom: 180,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 32,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#77777D',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  playlistList: {
    gap: 12,
  },
  playlistCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  playlistHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  playlistIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  playlistHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  playlistName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  playlistMeta: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: '#77777D',
    fontSize: 13,
  },
  savedTrackList: {
    gap: 6,
    marginTop: 4,
  },
  savedTrackRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 36,
    paddingVertical: 4,
  },
  savedTrackIndex: {
    color: '#77777D',
    fontSize: 12,
    fontWeight: '700',
    width: 24,
  },
  savedTrackInfo: {
    flex: 1,
    minWidth: 0,
  },
  savedTrackTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  savedTrackArtist: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 1,
  },
});
