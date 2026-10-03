import React from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text, StatusBar } from 'react-native';
import { useCustomerStore } from './src/store/useCustomerStore';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { MyBookingsScreen } from './src/screens/MyBookingsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { CheckoutModal } from './src/components/CheckoutModal';
import { AuthOtpModal } from './src/components/AuthOtpModal';

export default function App() {
  const { activeTab, setActiveTab, myBookings } = useCustomerStore();

  const activeCount = myBookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'HELD' || b.status === 'IN_PROGRESS'
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Screen Body */}
      <View style={styles.body}>
        {activeTab === 'explore' && <ExploreScreen />}
        {activeTab === 'bookings' && <MyBookingsScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('explore')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabIcon, activeTab === 'explore' && styles.tabIconActive]}>
            🎮
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'explore' && styles.tabLabelActive]}>
            Explore
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('bookings')}
          activeOpacity={0.8}
        >
          <View style={styles.badgeWrapper}>
            <Text style={[styles.tabIcon, activeTab === 'bookings' && styles.tabIconActive]}>
              🎟️
            </Text>
            {activeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, activeTab === 'bookings' && styles.tabLabelActive]}>
            My Passes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabIcon, activeTab === 'profile' && styles.tabIconActive]}>
            👤
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Global Bottom Sheets & Modals */}
      <CheckoutModal />
      <AuthOtpModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  body: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingBottom: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#818cf8',
    fontWeight: '700',
  },
  badgeWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
});
