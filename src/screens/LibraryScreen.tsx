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
  Play,
  Plus,
  Shuffle,
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

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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
  const [addingToPlaylistId, setAddingToPlaylistId] = useState<string | null>(
    null,
  );
  const [suggestedTracks, setSuggestedTracks] = useState<Track[]>([]);

  const uid = user?.uid;

  // ── Play Actions ──

  const handlePlayFromPlaylist = (track: Track, playlistTrackIds: string[]) => {
    playTrack(track, playlistTrackIds);
  };

  const handlePlayAll = (playlistTrackIds: string[]) => {
    if (playlistTrackIds.length === 0) return;
    const firstTrack = resolveTrack(playlistTrackIds[0]);
    if (firstTrack) {
      playTrack(firstTrack, playlistTrackIds);
    }
  };

  const handleShufflePlay = (playlistTrackIds: string[]) => {
    if (playlistTrackIds.length === 0) return;
    const shuffled = shuffleArray(playlistTrackIds);
    const firstTrack = resolveTrack(shuffled[0]);
    if (firstTrack) {
      playTrack(firstTrack, shuffled);
    }
  };

  // ── Edit Actions ──

  const handleStartEditing = (playlistId: string, currentName: string) => {
    setEditingPlaylistId(playlistId);
    setRenameInput(currentName);
    setAddingToPlaylistId(null);
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

  // ── Add Tracks Actions ──

  const handleToggleAddTracks = (playlistId: string) => {
    if (addingToPlaylistId === playlistId) {
      setAddingToPlaylistId(null);
      setSuggestedTracks([]);
    } else {
      const playlist = playlists.find(item => item.id === playlistId);
      const existingTrackIds = new Set(playlist?.trackIds ?? []);
      const availableTracks = tracks.filter(
        track => !existingTrackIds.has(track.id),
      );

      setAddingToPlaylistId(playlistId);
      setEditingPlaylistId(null);
      setSuggestedTracks(shuffleArray(availableTracks).slice(0, 6));
    }
  };

  const handleAddTrackToPlaylist = (playlistId: string, trackId: string) => {
    if (!uid) return;
    usePlaylistStore.getState().addTrackToPlaylist(uid, trackId, playlistId);
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
            const isAddingTracks = addingToPlaylistId === playlist.id;
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

                  {/* Action buttons row */}
                  {!isEditing ? (
                    <View style={styles.headerActions}>
                      {/* Play All */}
                      <TouchableOpacity
                        activeOpacity={0.78}
                        onPress={() => handlePlayAll(playlist.trackIds)}
                        disabled={resolvedTracks.length === 0}
                        style={[
                          styles.iconBtn,
                          resolvedTracks.length === 0 && styles.disabledBtn,
                          { backgroundColor: primaryAccent },
                        ]}
                      >
                        <Play
                          color="#000000"
                          fill="#000000"
                          size={14}
                          strokeWidth={2}
                        />
                      </TouchableOpacity>
                      {/* Shuffle */}
                      <TouchableOpacity
                        activeOpacity={0.78}
                        onPress={() => handleShufflePlay(playlist.trackIds)}
                        disabled={resolvedTracks.length < 2}
                        style={[
                          styles.iconBtn,
                          resolvedTracks.length < 2 && styles.disabledBtn,
                        ]}
                      >
                        <Shuffle
                          color={primaryAccent}
                          size={14}
                          strokeWidth={2}
                        />
                      </TouchableOpacity>
                      {/* Add Tracks */}
                      <TouchableOpacity
                        activeOpacity={0.78}
                        onPress={() => handleToggleAddTracks(playlist.id)}
                        style={[
                          styles.iconBtn,
                          isAddingTracks && {
                            backgroundColor: `${primaryAccent}33`,
                          },
                        ]}
                      >
                        <Plus
                          color={primaryAccent}
                          size={16}
                          strokeWidth={2.5}
                        />
                      </TouchableOpacity>
                      {/* Edit */}
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
                      {/* Delete */}
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

                {/* Add Tracks Browser */}
                {isAddingTracks && (
                  <View style={styles.addTracksSection}>
                    <View style={styles.addTracksHeader}>
                      <Text
                        style={[styles.addTracksTitle, { color: primaryAccent }]}
                      >
                        Add Tracks
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.78}
                        onPress={() => {
                          setAddingToPlaylistId(null);
                          setSuggestedTracks([]);
                        }}
                      >
                        <X color="#FFFFFF" size={18} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.suggestedSongsLabel}>
                      Suggested Songs
                    </Text>
                    <View style={styles.addTracksList}>
                      {suggestedTracks.length === 0 ? (
                        <Text style={styles.emptyText}>
                          No more songs to suggest for this playlist.
                        </Text>
                      ) : null}
                      {suggestedTracks.map(track => {
                        const alreadyAdded = playlist.trackIds.includes(
                          track.id,
                        );

                        return (
                          <View key={track.id} style={styles.addTrackRow}>
                            <Image
                              source={{ uri: track.artwork }}
                              style={styles.addTrackArt}
                            />
                            <View style={styles.addTrackInfo}>
                              <Text
                                numberOfLines={1}
                                style={styles.addTrackTitle}
                              >
                                {track.title}
                              </Text>
                              <Text
                                numberOfLines={1}
                                style={styles.addTrackArtist}
                              >
                                {track.artist}
                              </Text>
                            </View>
                            {alreadyAdded ? (
                              <View
                                style={[
                                  styles.addedBadge,
                                  { backgroundColor: `${primaryAccent}22` },
                                ]}
                              >
                                <Check
                                  color={primaryAccent}
                                  size={12}
                                  strokeWidth={3}
                                />
                                <Text
                                  style={[
                                    styles.addedText,
                                    { color: primaryAccent },
                                  ]}
                                >
                                  Added
                                </Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                activeOpacity={0.78}
                                onPress={() =>
                                  handleAddTrackToPlaylist(
                                    playlist.id,
                                    track.id,
                                  )
                                }
                                style={[
                                  styles.addTrackBtn,
                                  { borderColor: primaryAccent },
                                ]}
                              >
                                <Plus
                                  color={primaryAccent}
                                  size={14}
                                  strokeWidth={2.5}
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Tracks */}
                {!isAddingTracks && resolvedTracks.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No tracks yet — tap the + button above to browse and add songs.
                  </Text>
                ) : !isAddingTracks ? (
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
                ) : null}
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

  /* ── Add Tracks Section ── */
  addTracksSection: {
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  addTracksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addTracksTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  suggestedSongsLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  addTracksList: {
    gap: 4,
    maxHeight: 320,
  },
  addTrackRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 46,
    paddingVertical: 3,
  },
  addTrackArt: {
    borderRadius: 6,
    height: 38,
    width: 38,
  },
  addTrackInfo: {
    flex: 1,
    minWidth: 0,
  },
  addTrackTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  addTrackArtist: {
    color: '#B3B3B3',
    fontSize: 11,
    marginTop: 1,
  },
  addTrackBtn: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  addedBadge: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addedText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* ── Track List ── */
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
