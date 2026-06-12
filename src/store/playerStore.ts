import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { tracks, type Track } from '../constants/tracks';
import { audioAssets } from '../constants/assetRegistry';
import { useAuthStore } from './authStore';
import { recordTrackPlay } from '../services/firebase/firestoreService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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
  /**
   * Locally imported tracks — persisted to AsyncStorage so they survive
   * full app kill/relaunch cycles. Combined with bundled `tracks` at
   * runtime to form the full navigable collection.
   */
  localTracks: Track[];
  /** Appends a local track to the persisted collection and notifies all subscribers. */
  addLocalTrack: (track: Track) => void;
  playTrack: (track: Track, playlistTrackIds?: string[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  autoAdvanceToNext: () => void;
  seek: (progressPercent: number) => void;
  reset: () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Web Audio Engine  (HTMLAudioElement — untouched from original)
// ─────────────────────────────────────────────────────────────────────────────

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

function attachWebAudioListeners(set: (state: Partial<PlayerState>) => void) {
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
    set({ isPlaying: false });
  };
}

function playWebAudioForTrack(
  track: Track,
  set: (state: Partial<PlayerState>) => void,
) {
  const audio = getWebAudio();

  if (!audio) {
    set({ isPlaying: false });
    return;
  }

  attachWebAudioListeners(set);

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

function resetWebAudioEngine() {
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

// ─────────────────────────────────────────────────────────────────────────────
// Native Audio Engine  (expo-av Audio.Sound)
// ─────────────────────────────────────────────────────────────────────────────

// Lazily imported only on native to avoid web bundle bloat
let ExpoAV: typeof import('expo-av') | null = null;

async function getExpoAV() {
  if (!ExpoAV) {
    ExpoAV = await import('expo-av');
    // Enable audio to play in silent-mode on iOS
    await ExpoAV.Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }
  return ExpoAV;
}

let nativeSound: import('expo-av').Audio.Sound | null = null;
let activeNativeTrackId: string | null = null;
let positionInterval: ReturnType<typeof setInterval> | null = null;

function clearPositionInterval() {
  if (positionInterval !== null) {
    clearInterval(positionInterval);
    positionInterval = null;
  }
}

async function playNativeAudioForTrack(
  track: Track,
  set: (state: Partial<PlayerState>) => void,
) {
  const av = await getExpoAV();

  try {
    // Unload previous sound if switching tracks
    if (nativeSound && activeNativeTrackId !== track.id) {
      clearPositionInterval();
      await nativeSound.stopAsync().catch(() => {});
      await nativeSound.unloadAsync().catch(() => {});
      nativeSound = null;
      activeNativeTrackId = null;
    }

    // Resolve asset: use static require() registry on native
    const source = audioAssets[track.id] ?? { uri: track.url };

    if (!nativeSound || activeNativeTrackId !== track.id) {
      const { sound, status } = await av.Audio.Sound.createAsync(
        source,
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        (playbackStatus) => {
          if (!playbackStatus.isLoaded) return;

          const duration = playbackStatus.durationMillis
            ? playbackStatus.durationMillis / 1000
            : 0;
          const currentTime = playbackStatus.positionMillis / 1000;

          set({
            currentTime,
            duration,
            progress: duration > 0 ? currentTime / duration : 0,
          });

          if (playbackStatus.didJustFinish) {
            usePlayerStore.getState().autoAdvanceToNext();
          }
        },
      );

      nativeSound = sound;
      activeNativeTrackId = track.id;

      if (status.isLoaded) {
        const duration = status.durationMillis
          ? status.durationMillis / 1000
          : 0;
        set({ isPlaying: true, duration });
      } else {
        set({ isPlaying: false });
      }
    } else {
      // Same track — just resume
      await nativeSound.playAsync();
      set({ isPlaying: true });
    }
  } catch (error) {
    set({ isPlaying: false });
  }
}

async function toggleNativePlay(
  isCurrentlyPlaying: boolean,
  set: (state: Partial<PlayerState>) => void,
) {
  if (!nativeSound) {
    set({ isPlaying: false });
    return;
  }

  try {
    if (isCurrentlyPlaying) {
      await nativeSound.pauseAsync();
      set({ isPlaying: false });
    } else {
      await nativeSound.playAsync();
      set({ isPlaying: true });
    }
  } catch {
    set({ isPlaying: false });
  }
}

async function resetNativeAudioEngine() {
  clearPositionInterval();

  if (nativeSound) {
    try {
      await nativeSound.stopAsync();
      await nativeSound.unloadAsync();
    } catch {
      // Teardown may fail if sound is mid-load
    }
    nativeSound = null;
  }

  activeNativeTrackId = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves a track ID against the combined bundled + local collection.
 * Accepting the full list as a parameter keeps this pure and avoids
 * relying on any module-level mutable state.
 */
function resolveTrackFromList(trackId: string, allTracks: Track[]): Track | null {
  return allTracks.find(t => t.id === trackId) ?? null;
}

function firePlayCount(trackId: string) {
  const user = useAuthStore.getState().user;

  if (user) {
    recordTrackPlay(user.uid, trackId).catch(() => {});
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform dispatch helpers
// ─────────────────────────────────────────────────────────────────────────────

const isNative = Platform.OS !== 'web';

function dispatchPlay(track: Track, set: (state: Partial<PlayerState>) => void) {
  if (isNative) {
    playNativeAudioForTrack(track, set).catch(() => set({ isPlaying: false }));
  } else {
    playWebAudioForTrack(track, set);
  }
}

function dispatchToggle(isCurrentlyPlaying: boolean, set: (state: Partial<PlayerState>) => void) {
  if (isNative) {
    toggleNativePlay(isCurrentlyPlaying, set).catch(() => {});
  } else {
    const audio = getWebAudio();
    if (!audio) {
      set({ isPlaying: false });
      return;
    }

    if (audio.paused) {
      audio
        .play()
        .then(() => set({ isPlaying: true }))
        .catch(() => set({ isPlaying: false }));
    } else {
      audio.pause();
      set({ isPlaying: false });
    }
  }
}

function dispatchReset() {
  if (isNative) {
    resetNativeAudioEngine().catch(() => {});
  } else {
    resetWebAudioEngine();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Zustand Store
// ─────────────────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      currentTrackIndex: -1,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      progress: 0,
      recentTracks: [],
      playlistQueue: null,
      isAutoAdvancing: false,
      localTracks: [],

      addLocalTrack: (track: Track) => {
        set(state => ({ localTracks: [...state.localTracks, track] }));
      },

      playTrack: (track, playlistTrackIds) => {
        const state = get();
        const allTracks = [...tracks, ...state.localTracks];
        const queue = playlistTrackIds ?? null;
        const sourceList = queue ?? allTracks.map(t => t.id);
        const trackIndex = sourceList.indexOf(track.id);

        const updatedRecents = [
          track,
          ...state.recentTracks.filter(t => t.id !== track.id),
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

        dispatchPlay(track, set);
        firePlayCount(track.id);
      },

      togglePlay: () => {
        const { currentTrack, isPlaying } = get();

        if (!currentTrack) {
          set({ isPlaying: false });
          return;
        }

        dispatchToggle(isPlaying, set);
      },

      nextTrack: () => {
        const state = get();
        const allTracks = [...tracks, ...state.localTracks];
        const queue = state.playlistQueue;
        const sourceList = queue ?? allTracks.map(t => t.id);
        const nextIndex =
          state.currentTrackIndex < 0
            ? 0
            : (state.currentTrackIndex + 1) % sourceList.length;
        const nextId = sourceList[nextIndex];
        const next = resolveTrackFromList(nextId, allTracks);

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

        dispatchPlay(next, set);
        firePlayCount(next.id);
      },

      previousTrack: () => {
        const state = get();
        const allTracks = [...tracks, ...state.localTracks];
        const queue = state.playlistQueue;
        const sourceList = queue ?? allTracks.map(t => t.id);
        const previousIndex =
          state.currentTrackIndex <= 0
            ? sourceList.length - 1
            : state.currentTrackIndex - 1;
        const prevId = sourceList[previousIndex];
        const prev = resolveTrackFromList(prevId, allTracks);

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

        dispatchPlay(prev, set);
        firePlayCount(prev.id);
      },

      autoAdvanceToNext: () => {
        // Signal to the 3D TurntableDeck that an auto-advance is starting.
        // The deck watches this flag, triggers eject animation,
        // then calls nextTrack() after the animation completes.
        set({ isAutoAdvancing: true });

        // Fallback: if the 3D TurntableDeck is not mounted (e.g. playing from Library or on another screen),
        // or doesn't clear the flag within 250ms, advance to the next track directly.
        setTimeout(() => {
          const state = get();
          if (state.isAutoAdvancing) {
            set({ isAutoAdvancing: false });
            state.nextTrack();
          }
        }, 250);
      },

      seek: (progressPercent: number) => {
        const { duration } = get();
        if (!Number.isFinite(duration) || duration <= 0) return;
        if (!Number.isFinite(progressPercent) || progressPercent < 0 || progressPercent > 1) return;

        const targetTime = progressPercent * duration;
        if (!Number.isFinite(targetTime)) return;

        if (isNative) {
          if (nativeSound) {
            nativeSound.setPositionAsync(targetTime * 1000).catch(() => {});
          }
        } else {
          if (webAudio) {
            webAudio.currentTime = targetTime;
          }
        }

        set({
          currentTime: targetTime,
          progress: progressPercent,
        });
      },

      reset: () => {
        dispatchReset();
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
          // Note: localTracks is intentionally NOT reset on logout —
          // local files are device-owned, not tied to the user account.
        });
      },
    }),
    {
      name: 'melodisc-player-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the local tracks array. All transient playback state
      // (currentTrack, isPlaying, progress, etc.) is deliberately excluded
      // so the player always starts fresh on relaunch.
      partialize: (state) => ({ localTracks: state.localTracks }),
    },
  ),
);
