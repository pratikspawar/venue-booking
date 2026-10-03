import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useCustomerStore } from '../store/useCustomerStore';
import { SlotCell } from '../types';

export const SlotMatrix: React.FC = () => {
  const {
    resources,
    selectedResource,
    selectResource,
    availableSlots,
    selectedSlots,
    toggleSlot,
    openCheckout,
  } = useCustomerStore();

  const totalPaise = selectedSlots.reduce((acc, s) => acc + s.pricePaise, 0);

  return (
    <View style={styles.container}>
      {/* Resource Tabs (Console / Table Selector) */}
      <Text style={styles.sectionTitle}>Select Console / Table</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.resourceScroll}>
        {resources.map((r) => {
          const isSelected = selectedResource?.id === r.id;
          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.resourceTab, isSelected && styles.resourceTabActive]}
              onPress={() => selectResource(r)}
              activeOpacity={0.7}
            >
              <Text style={[styles.resourceName, isSelected && styles.resourceNameActive]}>
                {r.name}
              </Text>
              <Text style={[styles.resourceRate, isSelected && styles.resourceRateActive]}>
                ₹{r.ratePerHourPaise / 100}/hr
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#6366f1' }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: 'rgba(245, 158, 11, 0.3)' }]} />
          <Text style={styles.legendText}>Held</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: 'rgba(255, 255, 255, 0.02)' }]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
      </View>

      {/* Grid of Slots */}
      <View style={styles.slotsGrid}>
        {availableSlots.map((slot: SlotCell) => {
          const isSelected = selectedSlots.some((s) => s.startUtc === slot.startUtc);
          const isAvailable = slot.status === 'AVAILABLE';
          const isHeld = slot.status === 'HELD';
          const isBooked = slot.status === 'BOOKED';

          return (
            <TouchableOpacity
              key={slot.startUtc}
              disabled={!isAvailable}
              onPress={() => toggleSlot(slot)}
              style={[
                styles.slotCell,
                isSelected && styles.slotCellSelected,
                isHeld && styles.slotCellHeld,
                isBooked && styles.slotCellBooked,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.slotTime,
                  isSelected && styles.slotTimeSelected,
                  (isHeld || isBooked) && styles.slotTimeDisabled,
                ]}
              >
                {slot.label}
              </Text>
              <Text
                style={[
                  styles.slotPrice,
                  isSelected && styles.slotPriceSelected,
                  (isHeld || isBooked) && styles.slotPriceDisabled,
                ]}
              >
                {isBooked ? 'Booked' : isHeld ? 'Hold' : `₹${slot.pricePaise / 100}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom Sticky Action Bar if slots selected */}
      {selectedSlots.length > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.barDuration}>
              {selectedSlots.length * (selectedResource?.slotMinutes || 60)} mins selected
            </Text>
            <Text style={styles.barTotal}>Total: ₹{totalPaise / 100}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={openCheckout} activeOpacity={0.8}>
            <Text style={styles.checkoutBtnText}>Review & Hold Slot →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
