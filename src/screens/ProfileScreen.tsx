import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, LogOut, Palette, Settings as SettingsIcon } from 'lucide-react-native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';

import { logout, deleteAccount } from '../services/firebase/authService';
import {
  copyAudioToSandbox,
  copyArtworkToSandbox,
} from '../services/localMediaService';
import { useLocalMediaPicker } from '../hooks/useLocalMediaPicker';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useThemeStore } from '../store/themeStore';
import { webGlassStyle, webGlassStyleStrong } from '../theme/glassStyles';
import type { Track } from '../constants/tracks';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const accentPresets = [
  { id: 'light-blur', name: 'Light Blur', color: '#BDEBFF' },
  { id: 'neon-violet', name: 'Neon Violet', color: '#D8B4FE' },
  { id: 'mint-wave', name: 'Mint Wave', color: '#A7F3D0' },
  { id: 'sunset-amber', name: 'Sunset Amber', color: '#FDE68A' },
  { id: 'rose', name: 'Rose', color: '#FB7185' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ImportMusicModal
// ─────────────────────────────────────────────────────────────────────────────

type ImportMusicModalProps = {
  visible: boolean;
  onClose: () => void;
  primaryAccent: string;
};

// Genre options sourced from the app's genre taxonomy (mirrors SearchScreen genreTiles)
const GENRE_OPTIONS = [
  'K-Pop',
  'R&B',
  'Neo-Soul',
  'Jazz Pop',
  'Jazz Standards',
  'OPM',
  'Synth-pop',
  'Rage Rap',
  'Funk',
  'Pop',
  'Alt R&B',
  'Disco Pop',
  'Local Import',
];

function ImportMusicModal({ visible, onClose, primaryAccent }: ImportMusicModalProps) {
  const addLocalTrack = usePlayerStore(state => state.addLocalTrack);
  const { pickAudio, pickArtwork } = useLocalMediaPicker();

  const [titleInput, setTitleInput] = useState('');
  const [artistInput, setArtistInput] = useState('');
  const [pickedAudioUri, setPickedAudioUri] = useState<string | null>(null);
  const [pickedAudioName, setPickedAudioName] = useState<string | null>(null);
  const [pickedArtworkUri, setPickedArtworkUri] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState('Local Import');
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);

  const resetState = () => {
    setTitleInput('');
    setArtistInput('');
    setPickedAudioUri(null);
    setPickedAudioName(null);
    setPickedArtworkUri(null);
    setIsImporting(false);
    setImportError(null);
    setSelectedGenre('Local Import');
    setIsGenreDropdownOpen(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handlePickAudio = async () => {
    setImportError(null);
    const result = await pickAudio();
    if (result) {
      setPickedAudioUri(result.uri);
      setPickedAudioName(result.name);
    }
  };

  const handlePickArtwork = async () => {
    setImportError(null);
    const result = await pickArtwork();
    if (result) {
      setPickedArtworkUri(result.uri);
    }
  };

  const handleConfirmImport = async () => {
    if (!pickedAudioUri || !pickedAudioName) {
      setImportError('Please choose an audio file before importing.');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      // Fallback labels per spec
      const title = titleInput.trim() || 'Unknown Local Track';
      const artist = artistInput.trim() || 'Local Import';

      // Copy audio to permanent sandbox (native) or return blob URL (web)
      const permanentAudioUri = await copyAudioToSandbox(pickedAudioUri, pickedAudioName);

      // Copy artwork if provided
      let permanentArtworkUri = '';
      if (pickedArtworkUri) {
        permanentArtworkUri = await copyArtworkToSandbox(pickedArtworkUri);
      }

      // Build a unique ID using timestamp + sanitized title
      const id = `local-${Date.now()}-${title.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`;

      const track: Track = {
        id,
        title,
        artist,
        genre: selectedGenre,
        artwork: permanentArtworkUri,
        url: permanentAudioUri,
        isLocal: true,
      };

      addLocalTrack(track);
      resetState();
      onClose();
    } catch {
      setImportError('Failed to import the file. Please try again.');
      setIsImporting(false);
    }
  };

  // Truncate long file names for the label
  const audioLabel = pickedAudioName
    ? pickedAudioName.length > 36
      ? `${pickedAudioName.slice(0, 33)}...`
      : pickedAudioName
    : 'No file selected';

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <View style={importStyles.backdrop}>
        <View style={[importStyles.container, webGlassStyleStrong]}>
          {/* Header */}
          <View style={importStyles.header}>
            <View style={importStyles.headerLeft}>
              <Ionicons
                color={primaryAccent}
                name="cloud-upload-outline"
                size={22}
              />
              <Text style={importStyles.headerTitle}>Import Local Music</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Close import dialog"
              activeOpacity={0.75}
              onPress={handleClose}
              style={importStyles.closeBtn}
            >
              <Ionicons color="#FFFFFF" name="close" size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={importStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Audio File Picker ── */}
            <View style={importStyles.section}>
              <Text style={importStyles.sectionLabel}>Audio File</Text>
              <TouchableOpacity
                accessibilityLabel="Choose audio file"
                activeOpacity={0.8}
                onPress={handlePickAudio}
                style={[
                  importStyles.filePicker,
                  pickedAudioUri && { borderColor: `${primaryAccent}66` },
                ]}
              >
                <FontAwesome
                  color={pickedAudioUri ? primaryAccent : '#77777D'}
                  name="music"
                  size={18}
                />
                <View style={importStyles.filePickerText}>
                  <Text
                    numberOfLines={1}
                    style={[
                      importStyles.filePickerLabel,
                      pickedAudioUri && { color: primaryAccent },
                    ]}
                  >
                    {pickedAudioUri ? audioLabel : 'Choose Audio File'}
                  </Text>
                  {!pickedAudioUri && (
                    <Text style={importStyles.filePickerSub}>
                      MP3, M4A, FLAC, WAV, OGG and more
                    </Text>
                  )}
                </View>
                {pickedAudioUri && (
                  <Ionicons color={primaryAccent} name="checkmark-circle" size={20} />
                )}
              </TouchableOpacity>
            </View>

            {/* ── Cover Art + Metadata Row ── */}
            <View style={importStyles.artAndMeta}>
              {/* Artwork thumbnail */}
              <View style={importStyles.artFrame}>
                {pickedArtworkUri ? (
                  <Image
                    source={{ uri: pickedArtworkUri }}
                    style={importStyles.artPreview}
                  />
                ) : (
                  <View style={importStyles.artPlaceholder}>
                    <MaterialIcons color="#44444A" name="album" size={40} />
                  </View>
                )}
                <TouchableOpacity
                  accessibilityLabel="Attach cover art"
                  activeOpacity={0.8}
                  onPress={handlePickArtwork}
                  style={[
                    importStyles.artBtn,
                    { backgroundColor: `${primaryAccent}22`, borderColor: `${primaryAccent}44` },
                  ]}
                >
                  <MaterialIcons color={primaryAccent} name="photo-library" size={14} />
                  <Text style={[importStyles.artBtnText, { color: primaryAccent }]}>
                    {pickedArtworkUri ? 'Change' : 'Attach Cover Art'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Text inputs */}
              <View style={importStyles.metaFields}>
                <View style={importStyles.fieldGroup}>
                  <Text style={importStyles.fieldLabel}>Song Title</Text>
                  <TextInput
                    accessibilityLabel="Song title"
                    onChangeText={setTitleInput}
                    placeholder="Unknown Local Track"
                    placeholderTextColor="#44444A"
                    style={importStyles.textInput}
                    value={titleInput}
                  />
                </View>
                <View style={importStyles.fieldGroup}>
                  <Text style={importStyles.fieldLabel}>Artist Name</Text>
                  <TextInput
                    accessibilityLabel="Artist name"
                    onChangeText={setArtistInput}
                    placeholder="Local Import"
                    placeholderTextColor="#44444A"
                    style={importStyles.textInput}
                    value={artistInput}
                  />
                </View>
              </View>
            </View>

            {/* ── Genre Dropdown ── */}
            <View style={importStyles.section}>
              <Text style={importStyles.sectionLabel}>Genre</Text>
              <TouchableOpacity
                accessibilityLabel="Select genre"
                activeOpacity={0.82}
                onPress={() => setIsGenreDropdownOpen(prev => !prev)}
                style={[
                  importStyles.dropdownHeader,
                  isGenreDropdownOpen && { borderColor: `${primaryAccent}66` },
                ]}
              >
                <Text style={importStyles.dropdownHeaderText}>{selectedGenre}</Text>
                <Ionicons
                  color={isGenreDropdownOpen ? primaryAccent : '#77777D'}
                  name={isGenreDropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={18}
                />
              </TouchableOpacity>

              {isGenreDropdownOpen && (
                <View style={importStyles.dropdownList}>
                  {GENRE_OPTIONS.map(genre => {
                    const isSelected = genre === selectedGenre;
                    return (
                      <TouchableOpacity
                        accessibilityLabel={`Select genre ${genre}`}
                        activeOpacity={0.76}
                        key={genre}
                        onPress={() => {
                          setSelectedGenre(genre);
                          setIsGenreDropdownOpen(false);
                        }}
                        style={[
                          importStyles.dropdownItem,
                          isSelected && {
                            backgroundColor: `${primaryAccent}18`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            importStyles.dropdownItemText,
                            isSelected && { color: primaryAccent, fontWeight: '800' },
                          ]}
                        >
                          {genre}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            color={primaryAccent}
                            name="checkmark"
                            size={16}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Error */}
            {importError ? (
              <View style={importStyles.errorRow}>
                <Ionicons color="#FB7185" name="alert-circle-outline" size={16} />
                <Text style={importStyles.errorText}>{importError}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Action buttons */}
          <View style={importStyles.actions}>
            <TouchableOpacity
              activeOpacity={0.78}
              disabled={isImporting}
              onPress={handleClose}
              style={importStyles.cancelBtn}
            >
              <Text style={importStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Confirm import"
              activeOpacity={0.82}
              disabled={isImporting || !pickedAudioUri}
              onPress={handleConfirmImport}
              style={[
                importStyles.confirmBtn,
                { backgroundColor: primaryAccent },
                (isImporting || !pickedAudioUri) && importStyles.disabledBtn,
              ]}
            >
              {isImporting ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <Ionicons color="#000000" name="cloud-upload-outline" size={18} />
              )}
              <Text style={importStyles.confirmBtnText}>
                {isImporting ? 'Importing...' : 'Confirm Import'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProfileScreen
// ─────────────────────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.isLoading);
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const displayName = useThemeStore(state => state.displayName);
  const setPrimaryAccent = useThemeStore(state => state.setPrimaryAccent);
  const setDisplayName = useThemeStore(state => state.setDisplayName);
  const graphicsQuality = useThemeStore(state => state.graphicsQuality);
  const setGraphicsQuality = useThemeStore(state => state.setGraphicsQuality);
  const localTracksCount = usePlayerStore(state => state.localTracks.length);
  const isGuest = usePlayerStore(state => state.isGuest);
  const guestDisplayName = usePlayerStore(state => state.guestDisplayName);
  const resetPlayer = usePlayerStore(state => state.reset);
  const updateGuestDisplayName = usePlayerStore(state => state.updateGuestDisplayName);

  // ── Guest inline name editing state (Update 1.3.1) ──
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');

  // For guests, we show their chosen name read-only from the store.
  // For Firebase users, we use the cloud-synced displayName with editable input.
  const currentName = isGuest
    ? (guestDisplayName ?? '')
    : (displayName || user?.displayName || '');

  const [nameInput, setNameInput] = useState(currentName);
  const [nameSaved, setNameSaved] = useState(false);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteAccount();

    if (result.status === 'success') {
      setIsDeleteModalVisible(false);
    } else {
      setDeleteError(result.error ?? 'An error occurred while deleting your account.');
      setIsDeleting(false);
    }
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();

    if (trimmed && trimmed !== currentName) {
      setDisplayName(trimmed);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }
  };

  const avatarLetter = (
    (isGuest ? guestDisplayName : nameInput) || currentName || user?.email || 'M'
  ).charAt(0).toUpperCase();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsSettingsModalVisible(true)}
            style={[styles.settingsButton, { borderColor: `${primaryAccent}22` }]}
          >
            <SettingsIcon color={primaryAccent} size={22} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* User card */}
        <View style={[styles.profileCard, webGlassStyle]}>
          <View style={[styles.avatar, { backgroundColor: primaryAccent }]}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>

          {/* Display name editor — hidden for guest sessions */}
          {!isGuest ? (
            <View style={styles.nameRow}>
              <TextInput
                onChangeText={setNameInput}
                placeholder="Display Name"
                placeholderTextColor="#77777D"
                style={styles.nameInput}
                value={nameInput}
              />
              <TouchableOpacity
                activeOpacity={0.78}
                onPress={handleSaveName}
                style={[styles.saveButton, { backgroundColor: primaryAccent }]}
              >
                {nameSaved ? (
                  <Check color="#000000" size={16} strokeWidth={3} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // Guest: inline editable name display (Update 1.3.1)
            <View style={styles.guestNameDisplay}>
              {isEditingName ? (
                // Active editing row: TextInput + confirm + cancel
                <>
                  <TextInput
                    accessibilityLabel="Edit guest display name"
                    autoFocus
                    maxLength={40}
                    onChangeText={setEditNameInput}
                    placeholder="Display Name"
                    placeholderTextColor="#44444A"
                    style={styles.guestNameInput}
                    value={editNameInput}
                  />
                  <TouchableOpacity
                    accessibilityLabel="Confirm name change"
                    activeOpacity={0.75}
                    onPress={() => {
                      const trimmed = editNameInput.trim();
                      if (trimmed.length > 0) {
                        updateGuestDisplayName(trimmed);
                        setIsEditingName(false);
                      }
                    }}
                    style={[styles.guestEditBtn, { borderColor: `${primaryAccent}55` }]}
                  >
                    <Ionicons color={primaryAccent} name="checkmark-outline" size={19} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityLabel="Cancel name edit"
                    activeOpacity={0.75}
                    onPress={() => setIsEditingName(false)}
                    style={[styles.guestEditBtn, { borderColor: 'rgba(255,255,255,0.12)' }]}
                  >
                    <Ionicons color="#77777D" name="close-outline" size={19} />
                  </TouchableOpacity>
                </>
              ) : (
                // Static display row: person icon + name + pencil trigger
                <TouchableOpacity
                  accessibilityLabel="Edit guest display name"
                  activeOpacity={0.75}
                  onPress={() => {
                    setEditNameInput(guestDisplayName ?? '');
                    setIsEditingName(true);
                  }}
                  style={styles.guestNameRow}
                >
                  <Ionicons color="#77777D" name="person-outline" size={16} />
                  <Text style={styles.guestNameText} numberOfLines={1}>
                    {guestDisplayName ?? 'Guest'}
                  </Text>
                  <Ionicons color="#77777D" name="pencil-outline" size={14} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Email row — hidden for guest sessions (no cloud account) */}
          {!isGuest ? (
            <Text numberOfLines={1} style={styles.email}>
              {user?.email ?? 'No email available'}
            </Text>
          ) : (
            <Text style={styles.guestOfflineLabel}>Offline Guest Session</Text>
          )}
        </View>

        {/* Theme Picker */}
        <View style={[styles.themeSection, webGlassStyle]}>
          <View style={styles.themeTitleRow}>
            <Palette color={primaryAccent} size={20} strokeWidth={2} />
            <Text style={styles.themeSectionTitle}>Theme Accent</Text>
          </View>

          <View style={styles.accentRow}>
            {accentPresets.map(preset => {
              const isSelected = preset.color === primaryAccent;

              return (
                <TouchableOpacity
                  activeOpacity={0.82}
                  key={preset.id}
                  onPress={() => setPrimaryAccent(preset.color)}
                  style={styles.accentOption}
                >
                  <View
                    style={[
                      styles.colorCircle,
                      { backgroundColor: preset.color },
                      isSelected && styles.selectedCircle,
                      isSelected && { boxShadow: `0px 0px 16px ${preset.color}66` },
                    ]}
                  >
                    {isSelected ? (
                      <Check color="#000000" size={16} strokeWidth={3} />
                    ) : null}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.accentLabel,
                      isSelected && { color: preset.color },
                    ]}
                  >
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Import Local Music Card ── */}
        <TouchableOpacity
          accessibilityLabel="Import local music from device"
          activeOpacity={0.82}
          onPress={() => setIsImportModalVisible(true)}
          style={[styles.importCard, { borderColor: `${primaryAccent}33` }, webGlassStyle]}
        >
          <View style={[styles.importIconWrap, { backgroundColor: `${primaryAccent}18` }]}>
            <Ionicons color={primaryAccent} name="cloud-upload-outline" size={26} />
          </View>
          <View style={styles.importCardText}>
            <Text style={styles.importCardTitle}>Import Local Music</Text>
            <Text style={styles.importCardSub}>
              {localTracksCount > 0
                ? `${localTracksCount} local track${localTracksCount === 1 ? '' : 's'} imported`
                : 'Add audio files from your device'}
            </Text>
          </View>
          <Ionicons color="#44444A" name="chevron-forward" size={20} />
        </TouchableOpacity>

        {/* Sign Out — hidden for guests; replaced by Exit Guest Mode */}
        {!isGuest ? (
          <TouchableOpacity
            activeOpacity={0.82}
            disabled={isLoading}
            onPress={logout}
            style={[
              styles.signOutButton,
              { borderColor: primaryAccent },
              isLoading && styles.disabledButton,
            ]}
          >
            <LogOut color={primaryAccent} size={18} strokeWidth={2} />
            <Text style={[styles.signOutButtonText, { color: primaryAccent }]}>
              {isLoading ? 'Signing Out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            accessibilityLabel="Exit Guest Mode"
            activeOpacity={0.82}
            onPress={resetPlayer}
            style={[styles.signOutButton, { borderColor: primaryAccent }]}
          >
            <LogOut color={primaryAccent} size={18} strokeWidth={2} />
            <Text style={[styles.signOutButtonText, { color: primaryAccent }]}>
              Exit Guest Mode
            </Text>
          </TouchableOpacity>
        )}

        {/* Delete Account Button — hidden for guest sessions (no cloud account) */}
        {!isGuest ? (
          <TouchableOpacity
            activeOpacity={0.82}
            disabled={isLoading}
            onPress={() => {
              setDeleteError(null);
              setIsDeleteModalVisible(true);
            }}
            style={[
              styles.deleteAccountButton,
              isLoading && styles.disabledButton,
            ]}
          >
            <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
          </TouchableOpacity>
        ) : null}

        {/* Delete Account Confirmation Modal */}
        <Modal
          animationType="fade"
          onRequestClose={() => {
            if (!isDeleting) setIsDeleteModalVisible(false);
          }}
          transparent
          visible={isDeleteModalVisible}
        >
          <View style={styles.modalScrim}>
            <View style={[styles.deleteModal, webGlassStyleStrong]}>
              <Text style={styles.modalTitle}>Delete Account?</Text>
              <Text style={styles.modalWarningText}>
                Warning: This action is permanent and cannot be undone. All your playlists, settings, and profile details will be permanently deleted from our servers.
              </Text>

              {deleteError ? (
                <Text style={styles.modalErrorText}>{deleteError}</Text>
              ) : null}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  activeOpacity={0.78}
                  disabled={isDeleting}
                  onPress={() => setIsDeleteModalVisible(false)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.82}
                  disabled={isDeleting}
                  onPress={handleDeleteAccount}
                  style={[styles.deleteBtn, { backgroundColor: '#FB7185' }]}
                >
                  <Text style={styles.deleteBtnText}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Graphics Settings Modal */}
        <Modal
          animationType="fade"
          onRequestClose={() => setIsSettingsModalVisible(false)}
          transparent
          visible={isSettingsModalVisible}
        >
          <View style={styles.modalScrim}>
            <View style={[styles.settingsModal, webGlassStyleStrong]}>
              <Text style={styles.modalTitle}>Graphics Settings</Text>
              <Text style={styles.modalSubtitleText}>
                Adjust the 3D turntable environment quality for performance or visuals on your device.
              </Text>

              <View style={styles.optionsContainer}>
                {/* High Quality option */}
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => setGraphicsQuality('high')}
                  style={[
                    styles.qualityOption,
                    graphicsQuality === 'high' && { borderColor: primaryAccent },
                  ]}
                >
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionTitle}>High Quality</Text>
                    {graphicsQuality === 'high' ? (
                      <Check color={primaryAccent} size={18} strokeWidth={3} />
                    ) : null}
                  </View>
                  <Text style={styles.optionDescription}>
                    Enables real-time shadows, PBR glass refraction, and full room lighting.
                  </Text>
                </TouchableOpacity>

                {/* Low Quality option */}
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => setGraphicsQuality('low')}
                  style={[
                    styles.qualityOption,
                    graphicsQuality === 'low' && { borderColor: primaryAccent },
                  ]}
                >
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionTitle}>Low Quality (Performance)</Text>
                    {graphicsQuality === 'low' ? (
                      <Check color={primaryAccent} size={18} strokeWidth={3} />
                    ) : null}
                  </View>
                  <Text style={styles.optionDescription}>
                    Disables shadows and clearcoat reflections for butter-smooth rendering and longer battery life.
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.78}
                onPress={() => setIsSettingsModalVisible(false)}
                style={[styles.closeSettingsBtn, { backgroundColor: primaryAccent }]}
              >
                <Text style={styles.closeSettingsBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Import Music Modal — rendered outside ScrollView to avoid clipping */}
      <ImportMusicModal
        onClose={() => setIsImportModalVisible(false)}
        primaryAccent={primaryAccent}
        visible={isImportModalVisible}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — Profile Screen
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000000',
    flex: 1,
    height: '100%',
    paddingHorizontal: 20,
    paddingTop: 24,
    width: '100%',
  },
  content: {
    gap: 18,
    paddingBottom: 180,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    padding: 24,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 999,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  avatarText: {
    color: '#000000',
    fontSize: 34,
    fontWeight: '900',
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    color: '#FFFFFF',
    flex: 1,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    minWidth: 64,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  email: {
    color: '#77777D',
    fontSize: 13,
    maxWidth: '100%',
  },
  // ── Guest identity display (read-only / editable) ──
  guestNameDisplay: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  guestNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  guestNameText: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  // Inline edit input (mirrors nameInput glass style)
  guestNameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    color: '#FFFFFF',
    flex: 1,
    fontSize: 15,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  // Shared compact icon button for confirm / cancel
  guestEditBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  guestOfflineLabel: {
    color: '#77777D',
    fontSize: 12,
    fontStyle: 'italic',
  },
  themeSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    padding: 20,
  },
  themeTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  themeSectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  accentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  accentOption: {
    alignItems: 'center',
    gap: 6,
    minWidth: 56,
  },
  colorCircle: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 999,
    borderWidth: 2,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  selectedCircle: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  accentLabel: {
    color: '#B3B3B3',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  // ── Import Card ──
  importCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  importIconWrap: {
    alignItems: 'center',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  importCardText: {
    flex: 1,
    gap: 3,
  },
  importCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  importCardSub: {
    color: '#77777D',
    fontSize: 12,
  },
  // ── Sign Out / Delete ──
  signOutButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 52,
  },
  disabledButton: {
    opacity: 0.65,
  },
  signOutButtonText: {
    fontSize: 15,
    fontWeight: '900',
  },
  deleteAccountButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(251, 113, 133, 0.08)',
    borderRadius: 14,
    borderColor: 'rgba(251, 113, 133, 0.25)',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 8,
  },
  deleteAccountButtonText: {
    color: '#FB7185',
    fontSize: 15,
    fontWeight: '900',
  },
  // ── Modals (Delete + Settings) ──
  modalScrim: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  deleteModal: {
    backgroundColor: 'rgba(18, 18, 22, 0.96)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 400,
    padding: 24,
    width: '100%',
    gap: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  modalWarningText: {
    color: '#B3B3B3',
    fontSize: 14,
    lineHeight: 20,
  },
  modalErrorText: {
    color: '#FB7185',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  deleteBtn: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  deleteBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  settingsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  settingsModal: {
    backgroundColor: 'rgba(18, 18, 22, 0.96)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 400,
    padding: 24,
    width: '100%',
    gap: 16,
  },
  modalSubtitleText: {
    color: '#B3B3B3',
    fontSize: 13,
    lineHeight: 18,
    marginTop: -8,
  },
  optionsContainer: {
    gap: 12,
    width: '100%',
  },
  qualityOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  optionDescription: {
    color: '#77777D',
    fontSize: 12,
    lineHeight: 16,
  },
  closeSettingsBtn: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 46,
    width: '100%',
    marginTop: 8,
  },
  closeSettingsBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles — Import Music Modal
// ─────────────────────────────────────────────────────────────────────────────

const importStyles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'rgba(14, 14, 20, 0.97)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    width: '90%',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  scrollContent: {
    gap: 20,
    padding: 20,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: '#B3B3B3',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  filePicker: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filePickerText: {
    flex: 1,
    gap: 2,
  },
  filePickerLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  filePickerSub: {
    color: '#44444A',
    fontSize: 11,
  },
  artAndMeta: {
    flexDirection: 'row',
    gap: 14,
  },
  artFrame: {
    gap: 8,
    width: 100,
  },
  artPreview: {
    borderRadius: 10,
    height: 100,
    width: 100,
  },
  artPlaceholder: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  artBtn: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  artBtnText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  metaFields: {
    flex: 1,
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#77777D',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  errorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  errorText: {
    color: '#FB7185',
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  cancelBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  confirmBtn: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 50,
  },
  confirmBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  disabledBtn: {
    opacity: 0.45,
  },
  // ── Genre Dropdown ──
  dropdownHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownHeaderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownList: {
    backgroundColor: 'rgba(18, 18, 24, 0.98)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownItemText: {
    color: '#B3B3B3',
    fontSize: 14,
    fontWeight: '600',
  },
});
