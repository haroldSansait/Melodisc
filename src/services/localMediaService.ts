/**
 * localMediaService.ts — Native implementation
 *
 * Handles sandboxed file-system operations for locally imported tracks using
 * the expo-file-system v55 class-based API (File, Directory, Paths).
 *
 * Files are copied from the temporary picker cache into a permanent
 * 'imported_tracks/' subdirectory inside the app's document directory,
 * which is never cleared by the OS.
 *
 * This file is loaded on native (iOS / Android). The Vite web build resolves
 * `localMediaService.web.ts` first via the `.web.ts` extension order in
 * vite.config.ts, so no additional alias is required.
 */

import { Directory, File, Paths } from 'expo-file-system';

// ─────────────────────────────────────────────────────────────────────────────
// Directory Bootstrap
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns (and creates if absent) the permanent `imported_tracks/` directory
 * inside the app's document sandbox. Idempotent — safe to call before every
 * copy operation.
 */
function getImportDir(): Directory {
  const dir = new Directory(Paths.document, 'imported_tracks');
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio Copy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Copies an audio file from the temporary URI returned by expo-document-picker
 * into the permanent sandbox directory.
 *
 * @param tempUri  Temporary `file://` URI from the document picker.
 * @param baseName Original file name (used to preserve extension).
 * @returns        Permanent `file://` URI inside `imported_tracks/`.
 */
export async function copyAudioToSandbox(
  tempUri: string,
  baseName: string,
): Promise<string> {
  const importDir = getImportDir();
  const timestamp = Date.now();
  const ext = baseName.includes('.') ? baseName.split('.').pop() ?? 'mp3' : 'mp3';
  const destName = `audio_${timestamp}.${ext}`;

  const sourceFile = new File(tempUri);
  const destFile = new File(importDir, destName);
  sourceFile.copy(destFile);

  return destFile.uri;
}

// ─────────────────────────────────────────────────────────────────────────────
// Artwork Copy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Copies a cover art image from the temporary URI returned by expo-image-picker
 * into the permanent sandbox directory alongside its corresponding audio file.
 *
 * @param tempUri  Temporary `file://` URI from the image picker.
 * @returns        Permanent `file://` URI inside `imported_tracks/`.
 */
export async function copyArtworkToSandbox(tempUri: string): Promise<string> {
  const importDir = getImportDir();
  const timestamp = Date.now();
  // Strip any query parameters before extracting the extension
  const cleanUri = tempUri.split('?')[0];
  const ext = cleanUri.includes('.') ? cleanUri.split('.').pop() ?? 'jpg' : 'jpg';
  const destName = `artwork_${timestamp}.${ext}`;

  const sourceFile = new File(tempUri);
  const destFile = new File(importDir, destName);
  sourceFile.copy(destFile);

  return destFile.uri;
}
