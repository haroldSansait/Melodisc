/**
 * localMediaService.web.ts — Vite / Web shim
 *
 * On web (Vite build), expo-file-system is unavailable. Since expo-document-picker
 * and expo-image-picker both return `object://` blob URLs on web, no physical file
 * copy is needed — the blob URL IS the permanent reference for the session.
 *
 * Vite resolves `.web.ts` before `.ts` (see resolve.extensions in vite.config.ts),
 * so this shim is loaded automatically — no alias required.
 */

/**
 * No-op on web. Returns an empty string (no directory concept for blobs).
 */
export async function ensureImportDir(): Promise<string> {
  return '';
}

/**
 * On web, the blob URL returned by the document picker is already usable directly.
 * Pass-through with no file system operation.
 */
export async function copyAudioToSandbox(
  tempUri: string,
  _baseName: string,
): Promise<string> {
  return tempUri;
}

/**
 * On web, the blob URL returned by the image picker is already usable directly.
 * Pass-through with no file system operation.
 */
export async function copyArtworkToSandbox(tempUri: string): Promise<string> {
  return tempUri;
}
