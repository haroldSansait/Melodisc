import { create } from 'zustand';

import type { Track } from '../constants/tracks';

export type Playlist = {
  id: string;
  name: string;
  tracks: Track[];
};

type PlaylistState = {
  playlists: Playlist[];
  createPlaylist: (name: string) => string;
  addTrackToPlaylist: (track: Track, playlistId?: string) => void;
};

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [
    {
      id: 'my-playlist',
      name: 'My Playlist',
      tracks: [],
    },
  ],
  createPlaylist: name => {
    const nextNumber = get().playlists.length + 1;
    const playlistId = `playlist-${Date.now()}-${nextNumber}`;
    const trimmedName = name.trim() || `Playlist ${nextNumber}`;

    set(state => {
      return {
        playlists: [
          ...state.playlists,
          {
            id: playlistId,
            name: trimmedName,
            tracks: [],
          },
        ],
      };
    });

    return playlistId;
  },
  addTrackToPlaylist: (track, playlistId) => {
    const targetPlaylistId = playlistId ?? get().playlists[0]?.id;

    if (!targetPlaylistId) {
      return;
    }

    set(state => ({
      playlists: state.playlists.map(playlist => {
        if (playlist.id !== targetPlaylistId) {
          return playlist;
        }

        const alreadyAdded = playlist.tracks.some(item => item.id === track.id);

        return {
          ...playlist,
          tracks: alreadyAdded ? playlist.tracks : [...playlist.tracks, track],
        };
      }),
    }));
  },
}));
