import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
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
  CheckCircle2,
  ListMusic,
  Pencil,
  Play,
  Plus,
  PlusCircle,
  Shuffle,
  Trash2,
  X,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

import { artworkAssets } from '../constants/assetRegistry';
import { tracks, type Track } from '../constants/tracks';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useThemeStore } from '../store/themeStore';
import { webGlassStyle, webGlassStyleStrong } from '../theme/glassStyles';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves a track ID against both bundled and locally imported tracks.
 * localTracks is passed explicitly to keep this function pure.
 */
function resolveTrack(trackId: string, localTracks: Track[] = []): Track | null {
  return (
    tracks.find(t => t.id === trackId) ??
    localTracks.find(t => t.id === trackId) ??
    null
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Platform-conditional artwork source. Local tracks always use { uri } directly. */
function resolveArtworkSource(track: Track) {
  if (track.isLocal) {
    // Local imports: artwork is stored as a permanent URI or blob URL
    return track.artwork ? { uri: track.artwork } : null;
  }
  if (Platform.OS !== 'web' && artworkAssets[track.id]) {
    return artworkAssets[track.id];
  }
  return { uri: track.artwork };
}

// ─────────────────────────────────────────────────────────────────────────────
// AddPlaylistModal
// ─────────────────────────────────────────────────────────────────────────────

type AddPlaylistModalProps = {
  visible: boolean;
  onClose: () => void;
  primaryAccent: string;
};

function AddPlaylistModal({
  visible,
  onClose,
  primaryAccent,
}: AddPlaylistModalProps) {
  const uid = useAuthStore(state => state.user?.uid);
  const recentTracks = usePlayerStore(state => state.recentTracks);

  const [playlistName, setPlaylistName] = useState('');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [suggestedTracks, setSuggestedTracks] = useState<Track[]>([]);

  // The combined track list includes locally imported tracks for playlist building
  const allLocalTracks = usePlayerStore(state => state.localTracks);
  const allTracks = useMemo(() => [...tracks, ...allLocalTracks], [allLocalTracks]);

  // Generate suggested tracks when the modal opens
  useEffect(() => {
    if (visible) {
      const sampled = shuffleArray(allTracks).slice(0, 5);
      setSuggestedTracks(sampled);
    } else {
      setPlaylistName('');
      setSelectedTrackIds([]);
      setSuggestedTracks([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggleTrackSelection = useCallback((trackId: string) => {
    setSelectedTrackIds(prev =>
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId],
    );
  }, []);

  const handleCreatePlaylist = useCallback(async () => {
    if (!uid) {
      return;
    }

    const store = usePlaylistStore.getState();
    const playlistId = await store.createPlaylist(
      uid,
      playlistName.trim() || 'Untitled Playlist',
    );

    for (const trackId of selectedTrackIds) {
      store.addTrackToPlaylist(uid, trackId, playlistId);
    }

    onClose();
  }, [uid, playlistName, selectedTrackIds, onClose]);

  const recentTrackIds = useMemo(
    () => new Set(recentTracks.map(t => t.id)),
    [recentTracks],
  );

  const filteredSuggested = useMemo(
    () => suggestedTracks.filter(t => !recentTrackIds.has(t.id)),
    [suggestedTracks, recentTrackIds],
  );

  const renderTrackItem = (track: Track) => {
    const isSelected = selectedTrackIds.includes(track.id);
    const artSrc = resolveArtworkSource(track);

    return (
      <View key={track.id} style={modalStyles.trackRow}>
        {artSrc ? (
          <Image
            source={artSrc}
            style={modalStyles.trackArt}
          />
        ) : (
          <View style={[modalStyles.trackArt, modalStyles.trackArtFallback]}>
            <Ionicons color="#44444A" name="musical-note" size={18} />
          </View>
        )}
        <View style={modalStyles.trackInfo}>
          <Text numberOfLines={1} style={modalStyles.trackTitle}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={modalStyles.trackArtist}>
            {track.artist}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityLabel={
            isSelected
              ? `Remove ${track.title} from selection`
              : `Add ${track.title} to playlist`
          }
          activeOpacity={0.7}
          onPress={() => toggleTrackSelection(track.id)}
          style={modalStyles.toggleBtn}
        >
          {isSelected ? (
            <CheckCircle2
              color={primaryAccent}
              fill={`${primaryAccent}22`}
              size={26}
              strokeWidth={2}
            />
          ) : (
            <PlusCircle color="#77777D" size={26} strokeWidth={1.5} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.container, webGlassStyleStrong]}>
          {/* Modal Header */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>New Playlist</Text>
            <TouchableOpacity
              accessibilityLabel="Close modal"
              activeOpacity={0.7}
              onPress={onClose}
              style={modalStyles.closeBtn}
            >
              <X color="#FFFFFF" size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={modalStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Playlist Name Input */}
            <TextInput
              autoFocus
              onChangeText={setPlaylistName}
              placeholder="Playlist Name"
              placeholderTextColor="#77777D"
              style={modalStyles.nameInput}
              value={playlistName}
            />

            {/* Add from Recents */}
            {recentTracks.length > 0 ? (
              <View style={modalStyles.section}>
                <Text
                  style={[modalStyles.sectionTitle, { color: primaryAccent }]}
                >
                  Add from Recents
                </Text>
                <View style={modalStyles.trackList}>
                  {recentTracks.map(track => renderTrackItem(track))}
                </View>
              </View>
            ) : null}

            {/* Suggested Tracks */}
            <View style={modalStyles.section}>
              <Text
                style={[modalStyles.sectionTitle, { color: primaryAccent }]}
              >
                Suggested Tracks
              </Text>
              <View style={modalStyles.trackList}>
                {filteredSuggested.length === 0 ? (
                  <Text style={modalStyles.emptyText}>
                    No suggestions available right now.
                  </Text>
                ) : (
                  filteredSuggested.map(track => renderTrackItem(track))
                )}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={modalStyles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={onClose}
              style={modalStyles.cancelBtn}
            >
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleCreatePlaylist}
              style={[
                modalStyles.createBtn,
                { backgroundColor: primaryAccent },
              ]}
            >
              <Plus color="#000000" size={18} strokeWidth={2.5} />
              <Text style={modalStyles.createBtnText}>Create Playlist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LibraryScreen
// ─────────────────────────────────────────────────────────────────────────────

export function LibraryScreen() {
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const user = useAuthStore(state => state.user);
  const playlists = usePlaylistStore(state => state.playlists);
  const playTrack = usePlayerStore(state => state.playTrack);
  const deleteLocalTrack = usePlayerStore(state => state.deleteLocalTrack);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const localTracks = usePlayerStore(state => state.localTracks);

  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(
    null,
  );
  const [renameInput, setRenameInput] = useState('');
  const [addingToPlaylistId, setAddingToPlaylistId] = useState<string | null>(
    null,
  );
  const [suggestedTracks, setSuggestedTracks] = useState<Track[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const uid = user?.uid;

  // ── Play Actions ──

  const handlePlayFromPlaylist = (track: Track, playlistTrackIds: string[]) => {
    playTrack(track, playlistTrackIds);
  };

  const handlePlayAll = (playlistTrackIds: string[]) => {
    if (playlistTrackIds.length === 0) return;
    const firstTrack = resolveTrack(playlistTrackIds[0], localTracks);
    if (firstTrack) {
      playTrack(firstTrack, playlistTrackIds);
    }
  };

  const handleShufflePlay = (playlistTrackIds: string[]) => {
    if (playlistTrackIds.length === 0) return;
    const shuffled = shuffleArray(playlistTrackIds);
    const firstTrack = resolveTrack(shuffled[0], localTracks);
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
      const allTracks = [...tracks, ...localTracks];
      const availableTracks = allTracks.filter(
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

        {/* ── + Add Playlist Button ── */}
        <TouchableOpacity
          accessibilityLabel="Add a new playlist"
          activeOpacity={0.82}
          onPress={() => setModalVisible(true)}
          style={[styles.addPlaylistBtn, { backgroundColor: primaryAccent }]}
        >
          <Plus color="#000000" size={20} strokeWidth={2.5} />
          <Text style={styles.addPlaylistBtnText}>Add Playlist</Text>
        </TouchableOpacity>

        {/* ── Local Imports Section ── */}
        {localTracks.length > 0 && (
          <View style={[styles.localImportsCard, webGlassStyle]}>
            <View style={styles.localImportsHeader}>
              <View style={[styles.localImportsIcon, { backgroundColor: `${primaryAccent}22` }]}>
                <Ionicons color={primaryAccent} name="phone-portrait-outline" size={18} />
              </View>
              <View style={styles.localImportsHeaderText}>
                <Text style={styles.localImportsTitle}>Local Imports</Text>
                <Text style={styles.localImportsMeta}>
                  {localTracks.length} {localTracks.length === 1 ? 'track' : 'tracks'} from your device
                </Text>
              </View>
            </View>

            <View style={styles.savedTrackList}>
              {localTracks.map(track => {
                const isActive = currentTrack?.id === track.id;
                const artSrc = resolveArtworkSource(track);

                return (
                  <TouchableOpacity
                    accessibilityLabel={`Play ${track.title} by ${track.artist}`}
                    activeOpacity={0.82}
                    key={track.id}
                    onPress={() => playTrack(track)}
                    style={styles.savedTrackRow}
                  >
                    {artSrc ? (
                      <Image
                        source={artSrc}
                        style={[
                          styles.savedTrackArt,
                          isActive && { borderColor: primaryAccent, borderWidth: 2 },
                        ]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.savedTrackArt,
                          styles.savedTrackArtFallback,
                          isActive && { borderColor: primaryAccent, borderWidth: 2 },
                        ]}
                      >
                        <Ionicons color="#44444A" name="musical-note" size={20} />
                      </View>
                    )}
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
                      <Text numberOfLines={1} style={styles.savedTrackArtist}>
                        {track.artist}
                      </Text>
                    </View>
                    <View style={styles.localTrackEndGroup}>
                      <Ionicons
                        color={isActive ? primaryAccent : '#44444A'}
                        name={isActive ? 'volume-high-outline' : 'chevron-forward'}
                        size={16}
                      />
                      <TouchableOpacity
                        accessibilityLabel={`Delete ${track.title} from local imports`}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => deleteLocalTrack(track.id)}
                        style={styles.deleteLocalTrackBtn}
                      >
                        <Ionicons color="#FB7185" name="trash-outline" size={17} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {playlists.length === 0 && localTracks.length === 0 ? (
          <View style={[styles.emptyCard, webGlassStyle]}>
            <ListMusic color="#77777D" size={40} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No playlists yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Add Playlist" to create your first playlist, or import local music from the Profile tab.
            </Text>
          </View>
        ) : null}

        <View style={styles.playlistList}>
          {playlists.map(playlist => {
            const isEditing = editingPlaylistId === playlist.id;
            const isAddingTracks = addingToPlaylistId === playlist.id;
            const resolvedTracks = playlist.trackIds
              .map(id => resolveTrack(id, localTracks))
              .filter(Boolean) as Track[];

            return (
              <View key={playlist.id}
                style={[styles.playlistCard, webGlassStyle]}
              >
                {/* Playlist header */}
                <View style={styles.playlistHeader}>
                  <View style={styles.playlistHeaderTopRow}>
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
                        <Text numberOfLines={2} style={styles.playlistName}>
                          {playlist.name}
                        </Text>
                        <Text style={styles.playlistMeta}>
                          {resolvedTracks.length}{' '}
                          {resolvedTracks.length === 1 ? 'track' : 'tracks'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action buttons row — on its own line below the name */}
                  {!isEditing ? (
                    <View style={styles.headerActions}>
                      {/* Play All */}
                      <TouchableOpacity
                        accessibilityLabel="Play all tracks"
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
                        accessibilityLabel="Shuffle play"
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
                        accessibilityLabel="Add tracks to playlist"
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
                        accessibilityLabel="Edit playlist"
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
                        accessibilityLabel="Delete playlist"
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
                              source={resolveArtworkSource(track)}
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
                              source={resolveArtworkSource(track)}
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

                          {isEditing ? (
                            <View style={styles.trackActions}>
                              <TouchableOpacity
                                accessibilityLabel="Move track up"
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
                                accessibilityLabel="Move track down"
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
                                accessibilityLabel="Remove track"
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

      {/* ── Add Playlist Modal ── */}
      <AddPlaylistModal
        onClose={() => setModalVisible(false)}
        primaryAccent={primaryAccent}
        visible={modalVisible}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Library Screen Styles
// ─────────────────────────────────────────────────────────────────────────────

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
  addPlaylistBtn: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  addPlaylistBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
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
    gap: 10,
  },
  playlistHeaderTopRow: {
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
    paddingLeft: 54,
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
  savedTrackArtFallback: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    justifyContent: 'center',
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
  // ── Local Imports Card ──
  localImportsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  localImportsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  localImportsIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  localImportsHeaderText: {
    flex: 1,
  },
  localImportsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  localImportsMeta: {
    color: '#77777D',
    fontSize: 12,
    marginTop: 2,
  },
  localTrackEndGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  deleteLocalTrackBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Modal Styles
// ─────────────────────────────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'rgba(22, 22, 28, 0.97)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: '85%',
    overflow: 'hidden',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  scrollContent: {
    gap: 20,
    padding: 20,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  trackList: {
    gap: 4,
  },
  trackRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingVertical: 4,
  },
  trackArt: {
    borderRadius: 6,
    height: 40,
    width: 40,
  },
  trackArtFallback: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    justifyContent: 'center',
  },
  trackInfo: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  trackArtist: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 1,
  },
  toggleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  emptyText: {
    color: '#77777D',
    fontSize: 13,
    paddingVertical: 8,
  },
  actionRow: {
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  cancelBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  createBtn: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1.5,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 46,
  },
  createBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
});
