import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  resourceScroll: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  resourceTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 10,
  },
  resourceTabActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366f1',
  },
  resourceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  resourceNameActive: {
    color: '#818cf8',
  },
  resourceRate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  resourceRateActive: {
    color: '#cbd5e1',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
  },
  slotCell: {
    width: '30%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  slotCellSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8',
  },
  slotCellHeld: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  slotCellBooked: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'transparent',
    opacity: 0.4,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  slotTimeSelected: {
    color: '#ffffff',
  },
  slotTimeDisabled: {
    color: '#64748b',
  },
  slotPrice: {
    fontSize: 11,
    color: '#818cf8',
    marginTop: 4,
  },
  slotPriceSelected: {
    color: '#ffffff',
  },
  slotPriceDisabled: {
    color: '#475569',
  },
  bottomBar: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barDuration: {
    fontSize: 12,
    color: '#94a3b8',
  },
  barTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  checkoutBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
