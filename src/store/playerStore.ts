import { create } from 'zustand';

import { tracks, type Track } from '../constants/tracks';
import { useAuthStore } from './authStore';
import { recordTrackPlay } from '../services/firebase/firestoreService';

type PlayerState = {
  currentTrack: Track | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  /** Dynamically updated recent listening history (max 6) */
  recentTracks: Track[];
  /** When playing from a playlist, this holds the ordered track IDs */
  playlistQueue: string[] | null;
  /** Flag set true while auto-advance eject animation runs */
  isAutoAdvancing: boolean;
  playTrack: (track: Track, playlistTrackIds?: string[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  autoAdvanceToNext: () => void;
  reset: () => void;
};

let webAudio: HTMLAudioElement | null = null;
let activeAudioTrackId: string | null = null;

function getWebAudio() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!webAudio) {
    webAudio = new Audio();
    webAudio.preload = 'metadata';
  }

  return webAudio;
}

function resolveTrack(trackId: string): Track | null {
  return tracks.find(t => t.id === trackId) ?? null;
}

function attachAudioListeners(set: (state: Partial<PlayerState>) => void) {
  const audio = getWebAudio();

  if (!audio) {
    return;
  }

  audio.ontimeupdate = () => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const currentTime = audio.currentTime || 0;

    set({
      currentTime,
      duration,
      progress: duration > 0 ? currentTime / duration : 0,
    });
  };

  audio.onloadedmetadata = () => {
    set({
      duration: Number.isFinite(audio.duration) ? audio.duration : 0,
    });
  };

  audio.onended = () => {
    usePlayerStore.getState().autoAdvanceToNext();
  };

  audio.onerror = () => {
    set({
      isPlaying: false,
    });
  };
}

function playAudioForTrack(
  track: Track,
  set: (state: Partial<PlayerState>) => void,
) {
  const audio = getWebAudio();

  if (!audio) {
    set({ isPlaying: false });
    return;
  }

  attachAudioListeners(set);

  if (activeAudioTrackId !== track.id) {
    audio.src = track.url;
    audio.currentTime = 0;
    activeAudioTrackId = track.id;
  }

  audio
    .play()
    .then(() => {
      set({ isPlaying: true });
    })
    .catch(() => {
      set({ isPlaying: false });
    });
}

function firePlayCount(trackId: string) {
  const user = useAuthStore.getState().user;

  if (user) {
    recordTrackPlay(user.uid, trackId).catch(() => {});
  }
}

function resetAudioEngine() {
  if (!webAudio) {
    activeAudioTrackId = null;
    return;
  }

  try {
    webAudio.pause();
    webAudio.currentTime = 0;
    webAudio.ontimeupdate = null;
    webAudio.onloadedmetadata = null;
    webAudio.onended = null;
    webAudio.onerror = null;
    webAudio.removeAttribute('src');
    webAudio.load();
  } catch {
    // Browser audio teardown can throw if the element is mid-load.
  }

  activeAudioTrackId = null;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  currentTrackIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  progress: 0,
  recentTracks: [],
  playlistQueue: null,
  isAutoAdvancing: false,

  playTrack: (track, playlistTrackIds) => {
    // Determine which list we navigate through
    const queue = playlistTrackIds ?? null;
    const sourceList = queue ?? tracks.map(t => t.id);
    const trackIndex = sourceList.indexOf(track.id);

    // Update recents: deduplicate, unshift new, cap at 6
    const updatedRecents = [
      track,
      ...get().recentTracks.filter(t => t.id !== track.id),
    ].slice(0, 6);

    set({
      currentTrack: track,
      currentTrackIndex: trackIndex >= 0 ? trackIndex : 0,
      currentTime: 0,
      duration: 0,
      progress: 0,
      playlistQueue: queue,
      recentTracks: updatedRecents,
    });

    playAudioForTrack(track, set);
    firePlayCount(track.id);
  },

  togglePlay: () => {
    const audio = getWebAudio();
    const currentTrack = get().currentTrack;

    if (!audio || !currentTrack) {
      set({ isPlaying: false });
      return;
    }

    if (audio.paused) {
      audio
        .play()
        .then(() => {
          set({ isPlaying: true });
        })
        .catch(() => {
          set({ isPlaying: false });
        });
      return;
    }

    audio.pause();
    set({ isPlaying: false });
  },

  nextTrack: () => {
    const state = get();
    const queue = state.playlistQueue;
    const sourceList = queue ?? tracks.map(t => t.id);
    const nextIndex =
      state.currentTrackIndex < 0
        ? 0
        : (state.currentTrackIndex + 1) % sourceList.length;
    const nextId = sourceList[nextIndex];
    const next = resolveTrack(nextId);

    if (!next) {
      return;
    }

    const updatedRecents = [
      next,
      ...state.recentTracks.filter(t => t.id !== next.id),
    ].slice(0, 6);

    set({
      currentTrack: next,
      currentTrackIndex: nextIndex,
      currentTime: 0,
      duration: 0,
      progress: 0,
      recentTracks: updatedRecents,
    });

    playAudioForTrack(next, set);
    firePlayCount(next.id);
  },

  previousTrack: () => {
    const state = get();
    const queue = state.playlistQueue;
    const sourceList = queue ?? tracks.map(t => t.id);
    const previousIndex =
      state.currentTrackIndex <= 0
        ? sourceList.length - 1
        : state.currentTrackIndex - 1;
    const prevId = sourceList[previousIndex];
    const prev = resolveTrack(prevId);

    if (!prev) {
      return;
    }

    const updatedRecents = [
      prev,
      ...state.recentTracks.filter(t => t.id !== prev.id),
    ].slice(0, 6);

    set({
      currentTrack: prev,
      currentTrackIndex: previousIndex,
      currentTime: 0,
      duration: 0,
      progress: 0,
      recentTracks: updatedRecents,
    });

    playAudioForTrack(prev, set);
    firePlayCount(prev.id);
  },

  autoAdvanceToNext: () => {
    // Signal to the 3D deck that an auto-advance is starting
    set({ isAutoAdvancing: true });
    // The 3D TurntableDeck will watch this flag, trigger eject animation,
    // then call nextTrack() after the animation completes.
  },

  reset: () => {
    resetAudioEngine();
    set({
      currentTrack: null,
      currentTrackIndex: -1,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      progress: 0,
      recentTracks: [],
      playlistQueue: null,
      isAutoAdvancing: false,
    });
  },
}));
