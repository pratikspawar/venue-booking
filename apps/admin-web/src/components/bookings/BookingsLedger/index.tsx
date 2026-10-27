import React from 'react';
import { useBookingsLedgerController } from './BookingsLedger.controller';
import { BookingsLedgerView } from './BookingsLedger.view';

export const BookingsLedger: React.FC = () => {
  const controller = useBookingsLedgerController();
  return <BookingsLedgerView controller={controller} />;
};

export { useBookingsLedgerController } from './BookingsLedger.controller';
export type { BookingsLedgerController, BookingsLedgerViewMode } from './BookingsLedger.controller';
export { BookingsLedgerView } from './BookingsLedger.view';
