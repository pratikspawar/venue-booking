import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useCustomerStore } from '../store/useCustomerStore';
import { SportFilterPills } from '../components/SportFilterPills';
import { VenueCard } from '../components/VenueCard';
import { SlotMatrix } from '../components/SlotMatrix';
import { mobileApi } from '../services/api';
import { VenueItem } from '../types';

export const ExploreScreen: React.FC = () => {
  const {
    selectedSport,
    selectedVenue,
    selectVenue,
    clearSlots,
  } = useCustomerStore();

  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    mobileApi.fetchVenues(selectedSport).then(setVenues);
  }, [selectedSport]);

  const filteredVenues = venues.filter((v) => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.city.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* If a venue is currently selected, show the slot picker drill-down */}
      {selectedVenue ? (
        <View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              clearSlots();
              selectVenue(null as any);
            }}
          >
            <Text style={styles.backBtnText}>← Back to All Venues</Text>
          </TouchableOpacity>

          <View style={styles.venueBanner}>
            <Text style={styles.bannerName}>{selectedVenue.name}</Text>
            <Text style={styles.bannerAddress}>{selectedVenue.address}</Text>
            <Text style={styles.bannerMeta}>
              ★ {selectedVenue.rating} • {selectedVenue.distanceKm} km • Hours: {selectedVenue.openTime} - {selectedVenue.closeTime}
            </Text>
          </View>

          {/* Interactive Slot Grid for this venue */}
          <SlotMatrix />
        </View>
      ) : (
        <View>
          {/* Top Title & Subtitle */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Find & Book Game Lounges</Text>
            <Text style={styles.sub}>
              Instant confirmation • Live PS5 & Snooker slot availability
            </Text>
          </View>

          {/* Search Box */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search lounge, pool table, turf..."
              placeholderTextColor="#64748b"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Sport Categories Filter */}
          <SportFilterPills />

          {/* Venue List */}
          <View style={styles.list}>
            <Text style={styles.sectionTitle}>
              {filteredVenues.length} Lounges & Arenas Nearby
            </Text>
            {filteredVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  sub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 14,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtnText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '700',
  },
  venueBanner: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: 16,
  },
  bannerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  bannerAddress: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  bannerMeta: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 8,
  },
});
