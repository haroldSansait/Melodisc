/**
 * useLocalMediaPicker.web.ts
 *
 * Web-specific hook for choosing local media. Uses vanilla HTML5 file inputs
 * instead of expo-document-picker/expo-image-picker to avoid compiling native Expo libraries.
 */

export type PickedAudio = {
  uri: string;
  name: string;
};

export type PickedArtwork = {
  uri: string;
};

export function useLocalMediaPicker() {
  /**
   * Opens the browser file picker for audio files.
   */
  const pickAudio = (): Promise<PickedAudio | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';

      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const uri = URL.createObjectURL(file);
          resolve({ uri, name: file.name });
        } else {
          resolve(null);
        }
      };

      input.oncancel = () => {
        resolve(null);
      };

      input.click();
    });
  };

  /**
   * Opens the browser file picker for image files.
   */
  const pickArtwork = (): Promise<PickedArtwork | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const uri = URL.createObjectURL(file);
          resolve({ uri });
        } else {
          resolve(null);
        }
      };

      input.oncancel = () => {
        resolve(null);
      };

      input.click();
    });
  };

  return { pickAudio, pickArtwork };
}
