import type { Unsubscribe } from 'firebase/firestore';
import { create } from 'zustand';

import {
  addTrackToFirestorePlaylist,
  createFirestorePlaylist,
  deleteFirestorePlaylist,
  removeTrackFromFirestorePlaylist,
  renameFirestorePlaylist,
  reorderFirestorePlaylist,
  subscribeToFirestorePlaylists,
  type FirestorePlaylist,
} from '../services/firebase/firestoreService';

export type Playlist = {
  id: string;
  name: string;
  trackIds: string[];
};

type PlaylistState = {
  playlists: Playlist[];
  isLoaded: boolean;
  createPlaylist: (uid: string, name: string) => Promise<string>;
  addTrackToPlaylist: (
    uid: string,
    trackId: string,
    playlistId: string,
  ) => void;
  removeTrackFromPlaylist: (
    uid: string,
    playlistId: string,
    trackId: string,
  ) => void;
  renamePlaylist: (uid: string, playlistId: string, newName: string) => void;
  reorderPlaylist: (
    uid: string,
    playlistId: string,
    newTrackIds: string[],
  ) => void;
  deletePlaylist: (uid: string, playlistId: string) => void;
  subscribeToUserPlaylists: (uid: string) => Unsubscribe;
  reset: () => void;
};

function mapFirestorePlaylist(doc: FirestorePlaylist): Playlist {
  return {
    id: doc.id,
    name: doc.name,
    trackIds: doc.trackIds ?? [],
  };
}

export const usePlaylistStore = create<PlaylistState>((set, _get) => ({
  playlists: [],
  isLoaded: false,

  subscribeToUserPlaylists: uid => {
    const unsubscribe = subscribeToFirestorePlaylists(uid, docs => {
      set({
        playlists: docs.map(mapFirestorePlaylist),
        isLoaded: true,
      });
    });

    return unsubscribe;
  },

  createPlaylist: async (uid, name) => {
    const nextNumber = _get().playlists.length + 1;
    const playlistId = `playlist-${Date.now()}-${nextNumber}`;
    const trimmedName = name.trim() || `Playlist ${nextNumber}`;

    await createFirestorePlaylist(uid, playlistId, trimmedName);

    return playlistId;
  },

  addTrackToPlaylist: (uid, trackId, playlistId) => {
    addTrackToFirestorePlaylist(uid, playlistId, trackId).catch(() => {});
  },

  removeTrackFromPlaylist: (uid, playlistId, trackId) => {
    removeTrackFromFirestorePlaylist(uid, playlistId, trackId).catch(() => {});
  },

  renamePlaylist: (uid, playlistId, newName) => {
    renameFirestorePlaylist(uid, playlistId, newName).catch(() => {});
  },

  reorderPlaylist: (uid, playlistId, newTrackIds) => {
    reorderFirestorePlaylist(uid, playlistId, newTrackIds).catch(() => {});
  },

  deletePlaylist: (uid, playlistId) => {
    deleteFirestorePlaylist(uid, playlistId).catch(() => {});
  },

  reset: () => {
    set({ playlists: [], isLoaded: false });
  },
}));
