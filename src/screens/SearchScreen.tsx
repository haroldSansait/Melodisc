import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import { Search as SearchIcon } from 'lucide-react-native';

import { tracks, type Track } from '../constants/tracks';
import { usePlayerStore } from '../store/playerStore';
import { useThemeStore } from '../store/themeStore';
import { webGlassStyle } from '../theme/glassStyles';

type SearchScreenProps = {
  onOpenPlayer: () => void;
  onRequestAddToPlaylist: (track: Track) => void;
};

type GenreTile = {
  name: string;
  gradient: [string, string];
};

const genreTiles: GenreTile[] = [
  { name: 'Synthwave', gradient: ['#FF006E', '#8338EC'] },
  { name: 'Lo-fi', gradient: ['#5038A0', '#2D1B69'] },
  { name: 'Dream Pop', gradient: ['#7B2FF7', '#C471F5'] },
  { name: 'Ambient', gradient: ['#0D324D', '#7F5A83'] },
  { name: 'House', gradient: ['#F7971E', '#FFD200'] },
  { name: 'Chillwave', gradient: ['#43CEA2', '#185A9D'] },
  { name: 'Electropop', gradient: ['#E44D26', '#F16529'] },
  { name: 'Post Rock', gradient: ['#2C3E50', '#4CA1AF'] },
  { name: 'Future Garage', gradient: ['#0F2027', '#2C5364'] },
  { name: 'Alt R&B', gradient: ['#B24592', '#F15F79'] },
  { name: 'Nu Jazz', gradient: ['#1A2980', '#26D0CE'] },
  { name: 'Cinematic', gradient: ['#141E30', '#243B55'] },
];

export function SearchScreen({
  onOpenPlayer,
  onRequestAddToPlaylist,
}: SearchScreenProps) {
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const primaryAccent = useThemeStore(state => state.primaryAccent);
  const playTrack = usePlayerStore(state => state.playTrack);
  const currentTrack = usePlayerStore(state => state.currentTrack);

  const filteredTracks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    // If there's a text query, search all fields
    if (normalizedQuery) {
      return tracks.filter(track =>
        [track.title, track.artist, track.genre]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      );
    }

    // If a genre tile was tapped, filter by that genre
    if (genreFilter) {
      return tracks.filter(
        track => track.genre.toLowerCase() === genreFilter.toLowerCase(),
      );
    }

    return [];
  }, [query, genreFilter]);

  const showGenreTiles = !query.trim() && !genreFilter;

  const handleTrackPress = (track: Track) => {
    playTrack(track);
    onOpenPlayer();
  };

  const handleAddTrack = (event: GestureResponderEvent, track: Track) => {
    event.stopPropagation();
    onRequestAddToPlaylist(track);
  };

  const handleGenreTap = (genre: string) => {
    setGenreFilter(genre);
    setQuery('');
  };

  const handleClearGenre = () => {
    setGenreFilter(null);
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);

    if (text.trim()) {
      setGenreFilter(null);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Search</Text>

      {/* Search bar */}
      <View style={[styles.searchBarWrap, webGlassStyle]}>
        <SearchIcon color="#77777D" size={18} strokeWidth={2.2} />
        <TextInput
          autoCapitalize="none"
          onChangeText={handleQueryChange}
          placeholder="Songs, artists, genres"
          placeholderTextColor="#77777D"
          style={styles.searchInput}
          value={query}
        />
      </View>

      {/* Genre filter chip */}
      {genreFilter ? (
        <View style={styles.genreChipRow}>
          <View style={[styles.genreChip, { backgroundColor: `${primaryAccent}22` }]}>
            <Text style={[styles.genreChipText, { color: primaryAccent }]}>
              {genreFilter}
            </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={handleClearGenre}>
              <Text style={[styles.genreChipClose, { color: primaryAccent }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.results}
        showsVerticalScrollIndicator={false}
      >
        {showGenreTiles ? (
          <>
            <Text style={styles.sectionTitle}>Browse All</Text>
            <View style={styles.genreGrid}>
              {genreTiles.map(tile => {
                const gradientStyle: ViewStyle = {
                  background: `linear-gradient(135deg, ${tile.gradient[0]}, ${tile.gradient[1]})`,
                } as unknown as ViewStyle;

                return (
                  <TouchableOpacity
                    activeOpacity={0.84}
                    key={tile.name}
                    onPress={() => handleGenreTap(tile.name)}
                    style={[styles.genreTile, gradientStyle]}
                  >
                    <Text style={styles.genreTileText}>{tile.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <>
            {filteredTracks.length === 0 ? (
              <Text style={styles.emptyText}>
                No results found. Try a different search.
              </Text>
            ) : null}
            {filteredTracks.map(track => {
              const isActive = currentTrack?.id === track.id;

              return (
                <TouchableOpacity
                  activeOpacity={0.82}
                  key={track.id}
                  onPress={() => handleTrackPress(track)}
                  style={[
                    styles.resultCard,
                    webGlassStyle,
                    isActive && { borderColor: primaryAccent },
                  ]}
                >
                  <View
                    style={[
                      styles.resultThumb,
                      isActive
                        ? { backgroundColor: primaryAccent }
                        : styles.inactiveThumb,
                    ]}
                  />
                  <View style={styles.resultText}>
                    <Text numberOfLines={1} style={styles.trackTitle}>
                      {track.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.trackMeta}>
                      {track.artist} · {track.genre}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.76}
                    onPress={event => handleAddTrack(event, track)}
                    style={[styles.addButton, { borderColor: primaryAccent }]}
                  >
                    <Text style={[styles.addButtonText, { color: primaryAccent }]}>
                      +
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </>
        )}
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
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
    marginBottom: 16,
  },
  searchBarWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 15,
    minHeight: 50,
  },
  genreChipRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  genreChip: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  genreChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  genreChipClose: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 14,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreTile: {
    alignItems: 'flex-start',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    height: 100,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: 14,
    width: '48.5%',
  },
  genreTileText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  results: {
    gap: 10,
    paddingBottom: 180,
    paddingTop: 16,
  },
  emptyText: {
    color: '#77777D',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  resultCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 66,
    padding: 10,
  },
  resultThumb: {
    borderRadius: 8,
    height: 46,
    width: 46,
  },
  inactiveThumb: {
    backgroundColor: '#18181D',
  },
  resultText: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  trackMeta: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 3,
  },
  addButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
});
