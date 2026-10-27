import React from 'react';
import { BookingTicket } from '../../types';
import { useBookingTicketCardController } from './BookingTicketCard.controller';
import { BookingTicketCardView } from './BookingTicketCard.view';

export interface BookingTicketCardProps {
  ticket: BookingTicket;
}

export const BookingTicketCard: React.FC<BookingTicketCardProps> = ({ ticket }) => {
  const controller = useBookingTicketCardController(ticket);
  return <BookingTicketCardView controller={controller} />;
};

export { useBookingTicketCardController } from './BookingTicketCard.controller';
export { BookingTicketCardView } from './BookingTicketCard.view';
export { styles as bookingTicketStyles } from './BookingTicketCard.styles';
