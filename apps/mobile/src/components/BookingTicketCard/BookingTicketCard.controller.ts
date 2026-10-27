import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { BookingTicket } from '../../types';
import { useCustomerStore } from '../../store/useCustomerStore';

export interface BookingTicketCardController {
  ticket: BookingTicket;
  isCancelling: boolean;
  statusColor: string;
  canCancel: boolean;
  handleCancel: () => void;
}

export const useBookingTicketCardController = (ticket: BookingTicket): BookingTicketCardController => {
  const { cancelBooking } = useCustomerStore();
  const [isCancelling, setIsCancelling] = useState(false);

  const statusColor = useMemo(() => {
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
  }, [ticket.status]);

  const canCancel = useMemo(() => {
    return Boolean(ticket.canCancel && ticket.status !== 'CANCELLED' && ticket.status !== 'COMPLETED');
  }, [ticket.canCancel, ticket.status]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? Refund will follow venue cancellation policy.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await cancelBooking(ticket.bookingId);
            } catch (error) {
              Alert.alert('Cancellation failed', error instanceof Error ? error.message : 'Please try again.');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  }, [cancelBooking, ticket.bookingId]);

  return {
    ticket,
    isCancelling,
    statusColor,
    canCancel,
    handleCancel,
  };
};
