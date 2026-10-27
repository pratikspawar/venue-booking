import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
