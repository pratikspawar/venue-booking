import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useCustomerStore } from '../store/useCustomerStore';

export const ProfileScreen: React.FC = () => {
  const { user, language, setLanguage, openAuth, logoutUser } = useCustomerStore();

  const languages: { code: 'en' | 'mr' | 'hi'; label: string; script: string }[] = [
    { code: 'en', label: 'English', script: 'English' },
    { code: 'mr', label: 'Marathi', script: 'मराठी' },
    { code: 'hi', label: 'Hindi', script: 'हिंदी' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Account & Preferences</Text>
      </View>

      {/* User Card */}
      {user ? (
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userPhone}>{user.phone}</Text>
            <Text style={styles.userBadge}>Verified Customer</Text>
          </View>
        </View>
      ) : (
        <View style={styles.guestCard}>
          <Text style={styles.guestTitle}>Guest Mode</Text>
          <Text style={styles.guestSub}>Sign in to save your booking tickets and access wallet perks.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={openAuth}>
            <Text style={styles.loginBtnText}>Sign In with Phone OTP</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Wallet Balance Card */}
      <View style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <Text style={styles.walletIcon}>💳</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.walletLabel}>Apex Lounge Wallet</Text>
            <Text style={styles.walletAmount}>
              ₹{user ? user.walletBalancePaise / 100 : 0}
            </Text>
          </View>
          <TouchableOpacity style={styles.topupBtn}>
            <Text style={styles.topupBtnText}>+ Add Money</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.walletNote}>
          Use wallet balance for instant one-click booking holds and counter canteen snacks.
        </Text>
      </View>

      {/* Language Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Language / भाषा निवडा</Text>
        <View style={styles.langRow}>
          {languages.map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langBtn, language === l.code && styles.langBtnActive]}
              onPress={() => setLanguage(l.code)}
              activeOpacity={0.7}
            >
              <Text style={[styles.langText, language === l.code && styles.langTextActive]}>
                {l.script}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Help & Policies */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Cancellation & Refund Policy</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Venue Rules & PlayStation Guidelines</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Contact Desk Support</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {user && (
        <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  userPhone: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  userBadge: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
  guestCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  guestSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  walletCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  walletIcon: {
    fontSize: 28,
  },
  walletLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  walletAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  topupBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  topupBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  walletNote: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366f1',
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  langTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  menuSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  menuText: {
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  menuChevron: {
    fontSize: 18,
    color: '#64748b',
  },
  logoutBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#f43f5e',
    fontWeight: '700',
    fontSize: 14,
  },
});
