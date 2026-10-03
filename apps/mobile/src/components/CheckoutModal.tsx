import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useCustomerStore } from '../store/useCustomerStore';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    closeCheckout,
    selectedVenue,
    selectedResource,
    selectedSlots,
    selectedDate,
    confirmBooking,
  } = useCustomerStore();

  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'PAY_AT_VENUE'>('ONLINE');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isCheckoutOpen || !selectedVenue || !selectedResource) return null;

  const basePaise = selectedSlots.reduce((acc, s) => acc + s.pricePaise, 0);
  const gstPaise = Math.round(basePaise * 0.18); // 18% GST standard
  const totalPaise = basePaise + gstPaise;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await confirmBooking(paymentMode);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={isCheckoutOpen} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Confirm Slot Booking</Text>
              <Text style={styles.venueSubtitle}>{selectedVenue.name}</Text>
            </View>
            <TouchableOpacity onPress={closeCheckout} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Hold Timer Alert */}
            <View style={styles.holdBanner}>
              <Text style={styles.holdIcon}>⏱</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.holdTitle}>Slot Locked for 8:00 Minutes</Text>
                <Text style={styles.holdSub}>
                  No other customer can book this console while checkout is active.
                </Text>
              </View>
            </View>

            {/* Booking Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Resource:</Text>
                <Text style={styles.summaryVal}>{selectedResource.name}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryVal}>{selectedDate}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Reserved Time:</Text>
                <Text style={styles.summaryVal}>
                  {selectedSlots.map((s) => s.label).join(', ')}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Slot Amount:</Text>
                <Text style={styles.summaryVal}>₹{basePaise / 100}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST (18%):</Text>
                <Text style={styles.summaryVal}>₹{gstPaise / 100}</Text>
              </View>

              <View style={[styles.summaryRow, { marginTop: 6 }]}>
                <Text style={styles.totalLabel}>Total Payable:</Text>
                <Text style={styles.totalVal}>₹{totalPaise / 100}</Text>
              </View>
            </View>

            {/* Payment Mode Selector */}
            <Text style={styles.sectionHeader}>Choose Payment Method</Text>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMode === 'ONLINE' && styles.paymentOptionActive]}
              onPress={() => setPaymentMode('ONLINE')}
              activeOpacity={0.8}
            >
              <View style={styles.radio}>
                {paymentMode === 'ONLINE' && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentName}>UPI / Cards / NetBanking (Online)</Text>
                <Text style={styles.paymentDesc}>Instant auto-confirmation via Razorpay</Text>
              </View>
              <Text style={styles.badgeInstant}>Instant</Text>
            </TouchableOpacity>

            {selectedVenue.payAtVenueAllowed && (
              <TouchableOpacity
                style={[styles.paymentOption, paymentMode === 'PAY_AT_VENUE' && styles.paymentOptionActive]}
                onPress={() => setPaymentMode('PAY_AT_VENUE')}
                activeOpacity={0.8}
              >
                <View style={styles.radio}>
                  {paymentMode === 'PAY_AT_VENUE' && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentName}>Pay at Venue Counter</Text>
                  <Text style={styles.paymentDesc}>Pay with Cash or UPI QR when you arrive</Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Action CTA */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, isProcessing && styles.submitBtnDisabled]}
              onPress={handleConfirm}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>
                {isProcessing
                  ? 'Confirming Slot...'
                  : paymentMode === 'ONLINE'
                  ? `Pay ₹${totalPaise / 100} & Confirm Slot`
                  : 'Confirm Pay-at-Venue Slot'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  venueSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 20,
  },
  holdBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 16,
  },
  holdIcon: {
    fontSize: 20,
  },
  holdTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
  },
  holdSub: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  paymentOptionActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366f1',
  },
  paymentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  paymentDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  badgeInstant: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  submitBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
