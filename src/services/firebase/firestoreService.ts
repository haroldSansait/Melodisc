import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from './firebaseConfig';

// ────────────────────────────────────────
// User Profile  –  users/{uid}
// ────────────────────────────────────────

export type FirestoreUserProfile = {
  displayName?: string;
  primaryAccent?: string;
};

export async function saveUserProfile(
  uid: string,
  data: FirestoreUserProfile,
): Promise<void> {
  const ref = doc(db, 'users', uid);

  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function fetchUserProfile(
  uid: string,
): Promise<FirestoreUserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));

  if (!snap.exists()) {
    return null;
  }

  const data = snap.data();

  return {
    displayName: data.displayName ?? undefined,
    primaryAccent: data.primaryAccent ?? undefined,
  };
}

// ────────────────────────────────────────
// Playlists  –  users/{uid}/playlists/{id}
// ────────────────────────────────────────

export type FirestorePlaylist = {
  id: string;
  name: string;
  trackIds: string[];
  createdAt?: unknown;
};

export async function createFirestorePlaylist(
  uid: string,
  playlistId: string,
  name: string,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'playlists', playlistId);

  await setDoc(ref, {
    name,
    trackIds: [],
    createdAt: serverTimestamp(),
  });
}

export async function addTrackToFirestorePlaylist(
  uid: string,
  playlistId: string,
  trackId: string,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'playlists', playlistId);

  await updateDoc(ref, { trackIds: arrayUnion(trackId) });
}

export async function removeTrackFromFirestorePlaylist(
  uid: string,
  playlistId: string,
  trackId: string,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'playlists', playlistId);

  await updateDoc(ref, { trackIds: arrayRemove(trackId) });
}

export async function renameFirestorePlaylist(
  uid: string,
  playlistId: string,
  newName: string,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'playlists', playlistId);

  await updateDoc(ref, { name: newName });
}

export async function reorderFirestorePlaylist(
  uid: string,
  playlistId: string,
  newTrackIds: string[],
): Promise<void> {
  const ref = doc(db, 'users', uid, 'playlists', playlistId);

  await updateDoc(ref, { trackIds: newTrackIds });
}

export async function deleteFirestorePlaylist(
  uid: string,
  playlistId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'playlists', playlistId));
}

export async function fetchUserPlaylists(
  uid: string,
): Promise<FirestorePlaylist[]> {
  const col = collection(db, 'users', uid, 'playlists');
  const snap = await getDocs(col);

  return snap.docs.map(d => ({
    id: d.id,
    name: d.data().name ?? 'Untitled',
    trackIds: d.data().trackIds ?? [],
    createdAt: d.data().createdAt,
  }));
}

export function subscribeToFirestorePlaylists(
  uid: string,
  callback: (playlists: FirestorePlaylist[]) => void,
): Unsubscribe {
  const col = collection(db, 'users', uid, 'playlists');

  return onSnapshot(col, snap => {
    const playlists: FirestorePlaylist[] = snap.docs.map(d => ({
      id: d.id,
      name: d.data().name ?? 'Untitled',
      trackIds: d.data().trackIds ?? [],
      createdAt: d.data().createdAt,
    }));

    callback(playlists);
  });
}

// ────────────────────────────────────────
// Track Stats  –  users/{uid}/trackStats/{trackId}
// ────────────────────────────────────────

export type FirestoreTrackStats = {
  trackId: string;
  playCount: number;
  lastPlayedAt?: unknown;
};

export async function recordTrackPlay(
  uid: string,
  trackId: string,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'trackStats', trackId);

  await setDoc(
    ref,
    {
      playCount: increment(1),
      lastPlayedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function fetchTrackStats(
  uid: string,
): Promise<FirestoreTrackStats[]> {
  const col = collection(db, 'users', uid, 'trackStats');
  const snap = await getDocs(col);

  return snap.docs.map(d => ({
    trackId: d.id,
    playCount: d.data().playCount ?? 0,
    lastPlayedAt: d.data().lastPlayedAt,
  }));
}
