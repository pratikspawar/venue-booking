import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, StatusBar } from 'react-native';

export default function App() {
  const [selectedSport, setSelectedSport] = useState('ALL');

  const sports = [
    { code: 'ALL', name: 'All Games' },
    { code: 'PLAYSTATION', name: 'PlayStation 5' },
    { code: 'POOL', name: 'Snooker & Pool' },
    { code: 'TURF', name: 'Box Turf' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Book Your Slot</Text>
          <Text style={styles.subtitle}>Instant confirmation • Auto slot hold</Text>
        </View>

        {/* Sport Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
          {sports.map(s => (
            <TouchableOpacity
              key={s.code}
              onPress={() => setSelectedSport(s.code)}
              style={[styles.pill, selectedSport === s.code && styles.pillActive]}
            >
              <Text style={[styles.pillText, selectedSport === s.code && styles.pillTextActive]}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Available Venues List */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.venueName}>Apex Gaming Lounge</Text>
            <Text style={styles.badge}>Live Available</Text>
          </View>
          <Text style={styles.venueAddress}>Bandra West, Mumbai • 0.8 km</Text>

          <View style={styles.slotRow}>
            <Text style={styles.slotLabel}>PS5 Lounge (Console #1)</Text>
            <Text style={styles.slotPrice}>₹250 / hr</Text>
          </View>

          <TouchableOpacity style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Select Slot & Book</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.venueName}>Urban Turf & Snooker Club</Text>
            <Text style={styles.badge}>Live Available</Text>
          </View>
          <Text style={styles.venueAddress}>Andheri East, Mumbai • 2.4 km</Text>

          <View style={styles.slotRow}>
            <Text style={styles.slotLabel}>Tournament 8-Ball Table</Text>
            <Text style={styles.slotPrice}>₹300 / hr</Text>
          </View>

          <TouchableOpacity style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Select Slot & Book</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16'
  },
  content: {
    padding: 20
  },
  header: {
    marginBottom: 20
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8'
  },
  pillsScroll: {
    marginBottom: 24
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  pillActive: {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8'
  },
  pillText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 13
  },
  pillTextActive: {
    color: '#ffffff'
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff'
  },
  badge: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  venueAddress: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16
  },
  slotLabel: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500'
  },
  slotPrice: {
    color: '#818cf8',
    fontSize: 15,
    fontWeight: '700'
  },
  bookButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  bookButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  }
});
