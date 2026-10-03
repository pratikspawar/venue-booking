import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { VenueItem } from '../types';
import { useCustomerStore } from '../store/useCustomerStore';

interface VenueCardProps {
  venue: VenueItem;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue }) => {
  const { selectVenue } = useCustomerStore();

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{venue.name}</Text>
          <Text style={styles.address}>{venue.address}</Text>
        </View>
        <View style={styles.badgeLive}>
          <Text style={styles.badgeLiveText}>Live Available</Text>
        </View>
      </View>

      {/* Meta Row: Rating, Distance, Hours */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.starText}>★ {venue.rating}</Text>
          <Text style={styles.metaSub}>({venue.reviewCount})</Text>
        </View>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.metaText}>{venue.distanceKm} km away</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.metaText}>{venue.openTime} - {venue.closeTime}</Text>
      </View>

      {/* Sports Tags */}
      <View style={styles.tagsRow}>
        {venue.sports.map((s) => {
          const c = s.toUpperCase();
          const label = c.includes('PLAYSTATION') ? '🎮 PS5 Lounges'
            : c.includes('POOL') || c.includes('SNOOKER') ? '🎱 Pool / Snooker'
            : c.includes('TURF') ? '⚽ Turf'
            : c.includes('CARROM') ? '🎯 Carrom'
            : c.includes('BADMINTON') ? '🏸 Badminton'
            : c.includes('PICKLEBALL') ? '🏓 Pickleball'
            : c.includes('VR') ? '🥽 VR Gaming'
            : `🏆 ${s}`;
          return (
            <View key={s} style={styles.tag}>
              <Text style={styles.tagText}>{label}</Text>
            </View>
          );
        })}
      </View>

      {/* Price & CTA */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.pricePrefix}>Starting from</Text>
          <Text style={styles.price}>₹{venue.startingPricePaise / 100}<Text style={styles.priceUnit}> / slot</Text></Text>
        </View>

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => selectVenue(venue)}
          activeOpacity={0.8}
        >
          <Text style={styles.bookBtnText}>Select Slot & Book</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  address: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  badgeLive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeLiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
  },
  metaSub: {
    fontSize: 12,
    color: '#64748b',
  },
  dot: {
    color: '#475569',
    marginHorizontal: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pricePrefix: {
    fontSize: 11,
    color: '#94a3b8',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#818cf8',
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94a3b8',
  },
  bookBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
