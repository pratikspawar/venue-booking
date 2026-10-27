import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useCustomerStore } from '../store/useCustomerStore';
import { useTranslation } from '../locales';
import { MembershipCard } from '../components/MembershipCard';

export const ProfileScreen: React.FC = () => {
  const {
    user,
    language,
    setLanguage,
    openAuth,
    logoutUser,
    openWalletModal,
    customerPrepaidPackages,
    prepaidPackages,
    buyPrepaidPackage,
    fetchPrepaidPackages,
  } = useCustomerStore();
  const { t } = useTranslation();

  useEffect(() => {
    fetchPrepaidPackages();
  }, [fetchPrepaidPackages]);

  const languages: { code: 'en' | 'mr' | 'hi'; label: string; script: string }[] = [
    { code: 'en', label: 'English', script: 'English' },
    { code: 'mr', label: 'Marathi', script: 'मराठी' },
    { code: 'hi', label: 'Hindi', script: 'हिंदी' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('profile_title')}</Text>
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
            <Text style={styles.userBadge}>{t('profile_verified')}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.guestCard}>
          <Text style={styles.guestTitle}>{t('profile_guest')}</Text>
          <Text style={styles.guestSub}>{t('profile_guest_sub')}</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={openAuth}>
            <Text style={styles.loginBtnText}>{t('profile_signin_otp')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Wallet Balance Card */}
      <TouchableOpacity
        style={styles.walletCard}
        onPress={() => {
          if (!user) openAuth();
          else openWalletModal();
        }}
        activeOpacity={0.85}
      >
        <View style={styles.walletHeader}>
          <Text style={styles.walletIcon}>💳</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.walletLabel}>{t('profile_wallet_title')}</Text>
            <Text style={styles.walletAmount}>
              ₹{user ? (user.walletBalancePaise / 100).toFixed(0) : 0}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.topupBtn}
            onPress={() => {
              if (!user) openAuth();
              else openWalletModal();
            }}
          >
            <Text style={styles.topupBtnText}>{t('profile_add_money')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.walletNote}>
          {t('profile_wallet_note')}
        </Text>
      </TouchableOpacity>

      {/* Membership VIP Pass Card */}
      <MembershipCard />

      {/* Prepaid Game Hours Packages Card (Task 2.3) */}
      <View style={styles.prepaidCard}>
        <View style={styles.prepaidHeader}>
          <Text style={styles.prepaidIcon}>⏱️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.prepaidTitle}>Prepaid Game Hours Pass</Text>
            <Text style={styles.prepaidSub}>
              {customerPrepaidPackages.length > 0
                ? `${customerPrepaidPackages[0].packageName} • ${customerPrepaidPackages[0].remainingHours.toFixed(1)}h remaining (${customerPrepaidPackages[0].remainingMinutes}m)`
                : 'Save up to 30% with bulk hour bundles. Automatically deducted at slot checkout.'}
            </Text>
          </View>
          {customerPrepaidPackages.length > 0 ? (
            <View style={styles.activePrepaidBadge}>
              <Text style={styles.activePrepaidBadgeText}>{customerPrepaidPackages[0].remainingHours.toFixed(0)}H LEFT</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.buyPackageBtn}
              onPress={() => {
                if (!user) openAuth();
                else if (prepaidPackages.length > 0) buyPrepaidPackage(prepaidPackages[0].id);
              }}
            >
              <Text style={styles.buyPackageBtnText}>Buy Bundle</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Language Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile_language_title')}</Text>
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
          <Text style={styles.menuText}>{t('profile_cancellation_policy')}</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>{t('profile_rules_guidelines')}</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>{t('profile_contact_support')}</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {user && (
        <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
          <Text style={styles.logoutBtnText}>{t('profile_logout')}</Text>
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
  membershipCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  membershipIcon: {
    fontSize: 26,
  },
  membershipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fef08a',
  },
  membershipSub: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 2,
    lineHeight: 15,
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34d399',
  },
  activeBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  upgradeBtn: {
    backgroundColor: '#eab308',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  upgradeBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
  },
  prepaidCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  prepaidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  prepaidIcon: {
    fontSize: 26,
  },
  prepaidTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#a5b4fc',
  },
  prepaidSub: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 2,
    lineHeight: 15,
  },
  activePrepaidBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#818cf8',
  },
  activePrepaidBadgeText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buyPackageBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  buyPackageBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
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
