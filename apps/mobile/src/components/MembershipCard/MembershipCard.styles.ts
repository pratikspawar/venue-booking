import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  membershipCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
    marginBottom: 16,
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  membershipIcon: {
    fontSize: 28,
  },
  membershipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  membershipSub: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  activeBadgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
  },
  upgradeBtn: {
    backgroundColor: '#eab308',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  upgradeBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
  },
});
