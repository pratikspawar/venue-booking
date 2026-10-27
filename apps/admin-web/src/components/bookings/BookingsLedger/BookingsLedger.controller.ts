import { useState } from 'react';
import { useVenueStore } from '../../../store/useVenueStore';

export type BookingsLedgerViewMode = 'LEDGER' | 'AUDIT_LOGS';

export interface BookingsLedgerController {
  viewMode: BookingsLedgerViewMode;
  setViewMode: (mode: BookingsLedgerViewMode) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  filteredBookings: any[];
  openRefundModal: (booking: any) => void;
  markBookingNoShow: (id: string) => void;
}

export const useBookingsLedgerController = (): BookingsLedgerController => {
  const { bookings, openRefundModal, markBookingNoShow } = useVenueStore();
  const [viewMode, setViewMode] = useState<BookingsLedgerViewMode>('LEDGER');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (
      searchTerm &&
      !b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !b.customerPhone.includes(searchTerm) &&
      !b.id.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return {
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredBookings,
    openRefundModal,
    markBookingNoShow,
  };
};
