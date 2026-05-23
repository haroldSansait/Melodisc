const unsupported = async () => {
  throw new Error('expo-av is not available in the Vite web build.');
};

export const Audio = {
  setAudioModeAsync: async () => {},
  Sound: {
    createAsync: unsupported,
  },
};

export default {
  Audio,
};
