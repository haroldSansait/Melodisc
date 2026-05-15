import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ListMusic,
  Pencil,
  Trash2,
  X,
} from 'lucide-react-native';

import { tracks, type Track } from '../constants/tracks';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useThemeStore } from '../store/themeStore';
import { webGlassStyle } from '../theme/glassStyles';

function resolveTrack(trackId: string): Track | null {
  return tracks.find(t => t.id === trackId) ?? null;
}

export function LibraryScreen() {
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const user = useAuthStore(state => state.user);
  const playlists = usePlaylistStore(state => state.playlists);
  const playTrack = usePlayerStore(state => state.playTrack);
  const currentTrack = usePlayerStore(state => state.currentTrack);

  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(
    null,
  );
  const [renameInput, setRenameInput] = useState('');

  const uid = user?.uid;

  const handlePlayFromPlaylist = (track: Track, playlistTrackIds: string[]) => {
    playTrack(track, playlistTrackIds);
  };

  const handleStartEditing = (playlistId: string, currentName: string) => {
    setEditingPlaylistId(playlistId);
    setRenameInput(currentName);
  };

  const handleStopEditing = () => {
    setEditingPlaylistId(null);
    setRenameInput('');
  };

  const handleRename = (playlistId: string) => {
    const trimmed = renameInput.trim();

    if (!uid || !trimmed) {
      return;
    }

    usePlaylistStore.getState().renamePlaylist(uid, playlistId, trimmed);
    handleStopEditing();
  };

  const handleRemoveTrack = (playlistId: string, trackId: string) => {
    if (!uid) {
      return;
    }

    usePlaylistStore
      .getState()
      .removeTrackFromPlaylist(uid, playlistId, trackId);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    if (!uid) {
      return;
    }

    usePlaylistStore.getState().deletePlaylist(uid, playlistId);
    handleStopEditing();
  };

  const handleMoveTrack = (
    playlistId: string,
    trackIds: string[],
    index: number,
    direction: 'up' | 'down',
  ) => {
    if (!uid) {
      return;
    }

    const newIds = [...trackIds];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= newIds.length) {
      return;
    }

    [newIds[index], newIds[swapIndex]] = [newIds[swapIndex], newIds[index]];
    usePlaylistStore.getState().reorderPlaylist(uid, playlistId, newIds);
  };

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
          {playlists.map(playlist => {
            const isEditing = editingPlaylistId === playlist.id;
            const resolvedTracks = playlist.trackIds
              .map(resolveTrack)
              .filter(Boolean) as Track[];

            return (
              <View
                key={playlist.id}
                style={[styles.playlistCard, webGlassStyle]}
              >
                {/* Playlist header */}
                <View style={styles.playlistHeader}>
                  <View
                    style={[
                      styles.playlistIcon,
                      { backgroundColor: `${primaryAccent}22` },
                    ]}
                  >
                    <ListMusic
                      color={primaryAccent}
                      size={20}
                      strokeWidth={2}
                    />
                  </View>

                  {isEditing ? (
                    <View style={styles.renameRow}>
                      <TextInput
                        autoFocus
                        onChangeText={setRenameInput}
                        onSubmitEditing={() => handleRename(playlist.id)}
                        style={styles.renameInput}
                        value={renameInput}
                      />
                      <TouchableOpacity
                        activeOpacity={0.78}
                        onPress={() => handleRename(playlist.id)}
                        style={[
                          styles.iconBtn,
                          { backgroundColor: primaryAccent },
                        ]}
                      >
                        <Check color="#000000" size={14} strokeWidth={3} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.78}
                        onPress={handleStopEditing}
                        style={styles.iconBtn}
                      >
                        <X color="#FFFFFF" size={14} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.playlistHeaderText}>
                      <Text numberOfLines={1} style={styles.playlistName}>
                        {playlist.name}
                      </Text>
                      <Text style={styles.playlistMeta}>
                        {resolvedTracks.length}{' '}
                        {resolvedTracks.length === 1 ? 'track' : 'tracks'}
                      </Text>
                    </View>
                  )}

                  {/* Edit / Delete buttons */}
                  {!isEditing ? (
                    <View style={styles.headerActions}>
                      <TouchableOpacity
                        activeOpacity={0.78}
                        onPress={() =>
                          handleStartEditing(playlist.id, playlist.name)
                        }
                        style={styles.iconBtn}
                      >
                        <Pencil
                          color={primaryAccent}
                          size={16}
                          strokeWidth={2}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.78}
                        onPress={() => handleDeletePlaylist(playlist.id)}
                        style={styles.iconBtn}
                      >
                        <Trash2 color="#FB7185" size={16} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>

                {/* Tracks */}
                {resolvedTracks.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Add tracks with the + button on Home or Search.
                  </Text>
                ) : (
                  <View style={styles.savedTrackList}>
                    {resolvedTracks.map((track, index) => {
                      const isActive = currentTrack?.id === track.id;

                      return (
                        <View key={track.id} style={styles.savedTrackRow}>
                          {/* Play on tap */}
                          <TouchableOpacity
                            activeOpacity={0.82}
                            onPress={() =>
                              handlePlayFromPlaylist(
                                track,
                                playlist.trackIds,
                              )
                            }
                            style={styles.savedTrackPlayable}
                          >
                            <Image
                              source={{ uri: track.artwork }}
                              style={[
                                styles.savedTrackArt,
                                isActive && {
                                  borderColor: primaryAccent,
                                  borderWidth: 2,
                                },
                              ]}
                            />
                            <View style={styles.savedTrackInfo}>
                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.savedTrackTitle,
                                  isActive && { color: primaryAccent },
                                ]}
                              >
                                {track.title}
                              </Text>
                              <Text
                                numberOfLines={1}
                                style={styles.savedTrackArtist}
                              >
                                {track.artist}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          {/* Reorder + Remove controls */}
                          {isEditing ? (
                            <View style={styles.trackActions}>
                              <TouchableOpacity
                                activeOpacity={0.78}
                                disabled={index === 0}
                                onPress={() =>
                                  handleMoveTrack(
                                    playlist.id,
                                    playlist.trackIds,
                                    index,
                                    'up',
                                  )
                                }
                                style={[
                                  styles.smallIconBtn,
                                  index === 0 && styles.disabledBtn,
                                ]}
                              >
                                <ArrowUp
                                  color="#FFFFFF"
                                  size={14}
                                  strokeWidth={2}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                activeOpacity={0.78}
                                disabled={
                                  index === resolvedTracks.length - 1
                                }
                                onPress={() =>
                                  handleMoveTrack(
                                    playlist.id,
                                    playlist.trackIds,
                                    index,
                                    'down',
                                  )
                                }
                                style={[
                                  styles.smallIconBtn,
                                  index === resolvedTracks.length - 1 &&
                                    styles.disabledBtn,
                                ]}
                              >
                                <ArrowDown
                                  color="#FFFFFF"
                                  size={14}
                                  strokeWidth={2}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                activeOpacity={0.78}
                                onPress={() =>
                                  handleRemoveTrack(playlist.id, track.id)
                                }
                                style={styles.smallIconBtn}
                              >
                                <X
                                  color="#FB7185"
                                  size={14}
                                  strokeWidth={2.5}
                                />
                              </TouchableOpacity>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
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
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  renameRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  renameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    borderWidth: 1,
    color: '#FFFFFF',
    flex: 1,
    fontSize: 14,
    minHeight: 38,
    paddingHorizontal: 12,
  },
  iconBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  emptyText: {
    color: '#77777D',
    fontSize: 13,
  },
  savedTrackList: {
    gap: 4,
    marginTop: 4,
  },
  savedTrackRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
  },
  savedTrackPlayable: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  savedTrackArt: {
    borderRadius: 6,
    height: 40,
    width: 40,
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
  trackActions: {
    flexDirection: 'row',
    gap: 4,
  },
  smallIconBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  disabledBtn: {
    opacity: 0.3,
  },
});
