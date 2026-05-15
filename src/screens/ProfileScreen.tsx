import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, LogOut, Palette } from 'lucide-react-native';

import { logout } from '../services/firebase/authService';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { webGlassStyle } from '../theme/glassStyles';

const accentPresets = [
  { id: 'light-blur', name: 'Light Blur', color: '#BDEBFF' },
  { id: 'neon-violet', name: 'Neon Violet', color: '#D8B4FE' },
  { id: 'mint-wave', name: 'Mint Wave', color: '#A7F3D0' },
  { id: 'sunset-amber', name: 'Sunset Amber', color: '#FDE68A' },
  { id: 'rose', name: 'Rose', color: '#FB7185' },
];

export function ProfileScreen() {
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.isLoading);
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const displayName = useThemeStore(state => state.displayName);
  const setPrimaryAccent = useThemeStore(state => state.setPrimaryAccent);
  const setDisplayName = useThemeStore(state => state.setDisplayName);

  const currentName = displayName || user?.displayName || '';
  const [nameInput, setNameInput] = useState(currentName);
  const [nameSaved, setNameSaved] = useState(false);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();

    if (trimmed && trimmed !== currentName) {
      setDisplayName(trimmed);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }
  };

  const avatarLetter = (
    nameInput || currentName || user?.email || 'M'
  ).charAt(0).toUpperCase();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        {/* User card */}
        <View style={[styles.profileCard, webGlassStyle]}>
          <View style={[styles.avatar, { backgroundColor: primaryAccent }]}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>

          {/* Display name editor */}
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

          <Text numberOfLines={1} style={styles.email}>
            {user?.email ?? 'No email available'}
          </Text>
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

        {/* Sign Out */}
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
      </ScrollView>
    </View>
  );
}

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
});
