import React from 'react';
import { Text, View, Modal, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { CheckoutModalController } from './CheckoutModal.controller';
import { styles } from './CheckoutModal.styles';

export interface CheckoutModalViewProps {
  controller: CheckoutModalController;
}

export const CheckoutModalView: React.FC<CheckoutModalViewProps> = ({ controller }) => {
  const {
    isCheckoutOpen,
    selectedVenue,
    selectedResource,
    selectedSlots,
    selectedDate,
    checkoutBooking,
    totalPaise,
    paymentMode,
    setPaymentMode,
    isProcessing,
    error,
    secondsLeft,
    couponCode,
    setCouponCode,
    couponSuccess,
    couponError,
    isApplyingCoupon,
    handleApplyCoupon,
    handleConfirm,
    handleClose,
    clearCouponAlerts,
  } = controller;

  if (!isCheckoutOpen || !selectedVenue || !selectedResource) return null;

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
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Hold Timer Alert */}
            <View style={styles.holdBanner}>
              <Text style={styles.holdIcon}>⏱</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.holdTitle}>
                  {secondsLeft === null
                    ? 'Slots held for you'
                    : secondsLeft > 0
                    ? `Slots held for ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
                    : 'Slot hold expired'}
                </Text>
                <Text style={styles.holdSub}>
                  Other customers cannot book these slots during the hold. The server controls expiry.
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
                <Text style={styles.summaryLabel}>Base Rate:</Text>
                <Text style={styles.summaryVal}>₹{(totalPaise + (checkoutBooking?.discountPaise || 0)) / 100}</Text>
              </View>

              {(checkoutBooking?.discountPaise || 0) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#10b981', fontWeight: '600' }]}>Discount Applied:</Text>
                  <Text style={[styles.summaryVal, { color: '#10b981', fontWeight: '700' }]}>
                    -₹{(checkoutBooking?.discountPaise || 0) / 100}
                  </Text>
                </View>
              )}

              <View style={[styles.summaryRow, { marginTop: 6 }]}>
                <Text style={styles.totalLabel}>Payable Total:</Text>
                <Text style={styles.totalVal}>₹{totalPaise / 100}</Text>
              </View>
            </View>

            {/* Promo Code / Coupon Section */}
            <View style={styles.couponCard}>
              <Text style={styles.couponTitle}>🎟️ Have a Promo Coupon?</Text>
              <View style={styles.couponRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter code (e.g. SUMMER25)"
                  placeholderTextColor="#94a3b8"
                  value={couponCode}
                  onChangeText={(t) => {
                    setCouponCode(t);
                    clearCouponAlerts();
                  }}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.applyBtn, (!couponCode.trim() || isApplyingCoupon) && styles.applyBtnDisabled]}
                  onPress={handleApplyCoupon}
                  disabled={!couponCode.trim() || isApplyingCoupon}
                  activeOpacity={0.8}
                >
                  {isApplyingCoupon ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.applyBtnText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
              {couponSuccess && <Text style={styles.couponSuccessText}>✓ {couponSuccess}</Text>}
              {couponError && <Text style={styles.couponErrorText}>✗ {couponError}</Text>}
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
            {error && <Text style={styles.errorText}>{error}</Text>}
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
