import { create } from 'zustand';

import { tracks, type Track } from '../constants/tracks';

type PlayerState = {
  currentTrack: Track | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
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
    usePlayerStore.getState().nextTrack();
  };

  audio.onerror = () => {
    set({
      isPlaying: false,
    });
  };
}

function playAudioForTrack(track: Track, set: (state: Partial<PlayerState>) => void) {
  const audio = getWebAudio();

  if (!audio) {
    set({ isPlaying: false });
    return;
  }

  attachAudioListeners(set);

  if (activeAudioTrackId !== track.id) {
    audio.src = track.audioAsset;
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

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  currentTrackIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  progress: 0,
  playTrack: track => {
    const trackIndex = tracks.findIndex(item => item.id === track.id);

    set({
      currentTrack: track,
      currentTrackIndex: trackIndex,
      currentTime: 0,
      duration: 0,
      progress: 0,
    });

    playAudioForTrack(track, set);
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
    const nextIndex =
      state.currentTrackIndex < 0
        ? 0
        : (state.currentTrackIndex + 1) % tracks.length;
    const nextTrack = tracks[nextIndex];

    set({
      currentTrack: nextTrack,
      currentTrackIndex: nextIndex,
      currentTime: 0,
      duration: 0,
      progress: 0,
    });

    playAudioForTrack(nextTrack, set);
  },
  previousTrack: () => {
    const state = get();
    const previousIndex =
      state.currentTrackIndex <= 0
        ? tracks.length - 1
        : state.currentTrackIndex - 1;
    const previousTrack = tracks[previousIndex];

    set({
      currentTrack: previousTrack,
      currentTrackIndex: previousIndex,
      currentTime: 0,
      duration: 0,
      progress: 0,
    });

    playAudioForTrack(previousTrack, set);
  },
}));
