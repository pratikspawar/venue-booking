import React from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SlotCell } from '../../types';
import { SlotMatrixController } from './SlotMatrix.controller';
import { styles } from './SlotMatrix.styles';

export interface SlotMatrixViewProps {
  controller: SlotMatrixController;
}

export const SlotMatrixView: React.FC<SlotMatrixViewProps> = ({ controller }) => {
  const {
    resources,
    selectedResource,
    selectResource,
    availableSlots,
    selectedSlots,
    toggleSlot,
    totalPaise,
    beginCheckout,
  } = controller;

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
          <TouchableOpacity style={styles.checkoutBtn} onPress={beginCheckout} activeOpacity={0.8}>
            <Text style={styles.checkoutBtnText}>Review & Hold Slot →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
