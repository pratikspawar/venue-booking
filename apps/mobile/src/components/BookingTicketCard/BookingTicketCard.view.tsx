import React from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BookingTicketCardController } from './BookingTicketCard.controller';
import { styles } from './BookingTicketCard.styles';

interface BookingTicketCardViewProps {
  controller: BookingTicketCardController;
}

export const BookingTicketCardView: React.FC<BookingTicketCardViewProps> = ({ controller }) => {
  const { ticket, isCancelling, statusColor, canCancel, handleCancel } = controller;

  return (
    <View style={styles.card}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <Text style={styles.venueName}>{ticket.venueName}</Text>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{ticket.status}</Text>
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
          <Text style={styles.qrCodeText}>BOOKING</Text>
          <Text style={styles.ticketId}>#{ticket.bookingId}</Text>
        </View>

        <View style={{ flex: 1, paddingLeft: 16 }}>
          <Text style={styles.qrInstructions}>
            Show booking reference #{ticket.bookingId} at the venue desk.
          </Text>

          {canCancel && (
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.cancelBtn}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="#f43f5e" />
              ) : (
                <Text style={styles.cancelBtnText}>Cancel Booking</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};
