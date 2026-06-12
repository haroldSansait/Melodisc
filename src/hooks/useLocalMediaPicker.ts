/**
 * useLocalMediaPicker.ts
 *
 * Cross-platform hook that wraps expo-document-picker (audio) and
 * expo-image-picker (cover art). Both packages handle web and native
 * automatically without requiring separate shims.
 *
 * Returns:
 *   - pickAudio()   → { uri, name } | null
 *   - pickArtwork() → { uri } | null
 *
 * On cancellation the picker resolves with null — no exceptions thrown.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PickedAudio = {
  /** Temporary URI (native file:// or web blob://) */
  uri: string;
  /** Original filename including extension */
  name: string;
};

export type PickedArtwork = {
  /** Temporary URI (native file:// or web blob://) */
  uri: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useLocalMediaPicker() {
  /**
   * Opens the native/browser document picker filtered to audio MIME types.
   * Returns null if the user cancels without selecting.
   */
  const pickAudio = async (): Promise<PickedAudio | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        name: asset.name ?? `audio_${Date.now()}`,
      };
    } catch {
      // User cancelled or system error — return null gracefully
      return null;
    }
  };

  /**
   * Opens the device image library with enforced 1:1 square crop and
   * quality compression to keep storage footprints minimal.
   * Returns null if the user cancels without selecting.
   */
  const pickArtwork = async (): Promise<PickedArtwork | null> => {
    try {
      // Request permission on native (no-op on web)
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || result.assets.length === 0) {
        return null;
      }

      return { uri: result.assets[0].uri };
    } catch {
      return null;
    }
  };

  return { pickAudio, pickArtwork };
}
