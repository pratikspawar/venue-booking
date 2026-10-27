import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { VenueCardController } from './VenueCard.controller';
import { styles } from './VenueCard.styles';

export interface VenueCardViewProps {
  controller: VenueCardController;
}

export const VenueCardView: React.FC<VenueCardViewProps> = ({ controller }) => {
  const { venue, handleSelect, getTagLabel } = controller;

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
        {venue.sports.map((s) => (
          <View key={s} style={styles.tag}>
            <Text style={styles.tagText}>{getTagLabel(s)}</Text>
          </View>
        ))}
      </View>

      {/* Price & CTA */}
      <View style={styles.footer}>
        <View>
          {venue.startingPricePaise != null ? (
            <>
              <Text style={styles.pricePrefix}>Starting from</Text>
              <Text style={styles.price}>
                ₹{venue.startingPricePaise / 100}
                <Text style={styles.priceUnit}> / slot</Text>
              </Text>
            </>
          ) : (
            <Text style={styles.pricePrefix}>Price shown after slot selection</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={handleSelect}
          activeOpacity={0.8}
        >
          <Text style={styles.bookBtnText}>Select Slot & Book</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
