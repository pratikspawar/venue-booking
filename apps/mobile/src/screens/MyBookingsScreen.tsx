import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useCustomerStore } from '../store/useCustomerStore';
import { BookingTicketCard } from '../components/BookingTicketCard';

export const MyBookingsScreen: React.FC = () => {
  const { myBookings, setActiveTab, fetchMyBookings, user } = useCustomerStore();
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchMyBookings().catch((error) => setLoadError(error instanceof Error ? error.message : 'Could not load bookings'));
  }, [fetchMyBookings, user?.token]);
  const [filter, setFilter] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');

  const upcoming = myBookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'HELD' || b.status === 'IN_PROGRESS'
  );
  const history = myBookings.filter(
    (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'EXPIRED' || b.status === 'NO_SHOW'
  );

  const currentList = filter === 'UPCOMING' ? upcoming : history;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>My Game Passes</Text>
        <Text style={styles.sub}>
          Show your booking reference at the venue desk.
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, filter === 'UPCOMING' && styles.tabActive]}
          onPress={() => setFilter('UPCOMING')}
        >
          <Text style={[styles.tabText, filter === 'UPCOMING' && styles.tabTextActive]}>
            Upcoming & Live ({upcoming.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, filter === 'HISTORY' && styles.tabActive]}
          onPress={() => setFilter('HISTORY')}
        >
          <Text style={[styles.tabText, filter === 'HISTORY' && styles.tabTextActive]}>
            Past Bookings ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <View style={styles.list}>
        {loadError && <Text style={styles.emptySub}>{loadError}</Text>}
        {currentList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎟️</Text>
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptySub}>
              {filter === 'UPCOMING'
                ? "You don't have any upcoming game sessions. Pick a slot to start playing!"
                : 'Your completed or cancelled bookings will show here.'}
            </Text>
            {filter === 'UPCOMING' && (
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => setActiveTab('explore')}
              >
                <Text style={styles.exploreBtnText}>Browse Game Venues</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          currentList.map((ticket) => (
            <BookingTicketCard key={ticket.bookingId} ticket={ticket} />
          ))
        )}
      </View>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  sub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
