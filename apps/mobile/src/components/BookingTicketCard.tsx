import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { BookingTicket } from '../types';
import { useCustomerStore } from '../store/useCustomerStore';

interface BookingTicketCardProps {
  ticket: BookingTicket;
}

export const BookingTicketCard: React.FC<BookingTicketCardProps> = ({ ticket }) => {
  const { cancelBooking } = useCustomerStore();

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? Refund will follow venue cancellation policy.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelBooking(ticket.bookingId),
        },
      ]
    );
  };

  const getStatusColor = () => {
    switch (ticket.status) {
      case 'CONFIRMED':
        return '#10b981';
      case 'HELD':
        return '#f59e0b';
      case 'IN_PROGRESS':
        return '#38bdf8';
      case 'CANCELLED':
        return '#f43f5e';
      default:
        return '#94a3b8';
    }
  };

  return (
    <View style={styles.card}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <Text style={styles.venueName}>{ticket.venueName}</Text>
          <View style={[styles.statusBadge, { borderColor: getStatusColor() }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{ticket.status}</Text>
          </View>
        </View>
        <Text style={styles.venueAddress}>{ticket.venueAddress}</Text>

        <View style={styles.resourceBox}>
          <Text style={styles.resourceName}>{ticket.resourceName}</Text>
          <Text style={styles.sportBadge}>{ticket.sport}</Text>
        </View>

        <View style={styles.infoRow}>
          <View>
            <Text style={styles.infoLabel}>DATE</Text>
            <Text style={styles.infoValue}>{ticket.dateLabel}</Text>
          </View>
          <View>
            <Text style={styles.infoLabel}>TIME SLOT</Text>
            <Text style={styles.infoValue}>{ticket.timeWindow}</Text>
          </View>
          <View>
            <Text style={styles.infoLabel}>AMOUNT</Text>
            <Text style={styles.infoValue}>₹{ticket.amountPaise / 100}</Text>
          </View>
        </View>
      </View>

      {/* Perforated Divider */}
      <View style={styles.perforatedLine}>
        <View style={styles.cutoutLeft} />
        <View style={styles.dashLine} />
        <View style={styles.cutoutRight} />
      </View>

      {/* Bottom Check-in Section */}
      <View style={styles.bottomSection}>
        <View style={styles.qrBox}>
          <Text style={styles.qrCodeText}>[ QR PASS ]</Text>
          <Text style={styles.ticketId}>#{ticket.bookingId}</Text>
        </View>

        <View style={{ flex: 1, paddingLeft: 16 }}>
          <Text style={styles.qrInstructions}>
            Show this QR code at the desk for instant check-in.
          </Text>

          {ticket.canCancel && ticket.status !== 'CANCELLED' && (
            <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  topSection: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  venueAddress: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 14,
  },
  resourceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#818cf8',
  },
  sportBadge: {
    fontSize: 11,
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  perforatedLine: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  cutoutLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#090d16',
    marginLeft: -10,
  },
  cutoutRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#090d16',
    marginRight: -10,
  },
  dashLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  qrBox: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  qrCodeText: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '800',
  },
  ticketId: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  qrInstructions: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 8,
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  cancelBtnText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: '600',
  },
});
