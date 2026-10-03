import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useCustomerStore } from '../store/useCustomerStore';

const getSportIcon = (code: string): string => {
  const c = code.toUpperCase();
  if (c.includes('PLAYSTATION') || c.includes('PS5') || c.includes('CONSOLE')) return '🎮';
  if (c.includes('POOL') || c.includes('SNOOKER') || c.includes('BILLIARD')) return '🎱';
  if (c.includes('TURF') || c.includes('FOOTBALL') || c.includes('SOCCER')) return '⚽';
  if (c.includes('CARROM')) return '🎯';
  if (c.includes('BADMINTON')) return '🏸';
  if (c.includes('PICKLEBALL')) return '🏓';
  if (c.includes('TENNIS')) return '🎾';
  if (c.includes('VR')) return '🥽';
  if (c.includes('BOWLING')) return '🎳';
  if (c.includes('CRICKET')) return '🏏';
  return '🏆';
};

export const SportFilterPills: React.FC = () => {
  const { selectedSport, setSelectedSport, sports, fetchSports } = useCustomerStore();

  useEffect(() => {
    fetchSports();
  }, []);

  const allItems = [
    { code: 'ALL', label: 'All Sports', icon: '⚡' },
    ...sports.map((s) => ({
      code: s.code,
      label: s.nameEn,
      icon: s.icon || getSportIcon(s.code),
    })),
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {allItems.map((s) => {
          const isActive = selectedSport === s.code;
          return (
            <TouchableOpacity
              key={s.code}
              onPress={() => setSelectedSport(s.code)}
              style={[styles.pill, isActive && styles.pillActive]}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{s.icon}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pillActive: {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8',
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  labelActive: {
    color: '#ffffff',
  },
});
