import { useState, useCallback, useMemo } from 'react';
import { useVenueStore } from '../../../store/useVenueStore';
import { BookingItem } from '../../../types';

export interface RefundPolicyModalController {
  isOpen: boolean;
  booking: BookingItem | null;
  reason: string;
  setReason: (reason: string) => void;
  reasonCode: string;
  setReasonCode: (code: string) => void;
  managerApprovalCode: string;
  setManagerApprovalCode: (code: string) => void;
  errorMsg: string;
  isProcessing: boolean;
  paidAmount: number;
  isHighValue: boolean;
  refundPercent: number;
  refundAmount: number;
  retentionFee: number;
  handleConfirm: () => Promise<void>;
  closeModal: () => void;
}

export const useRefundPolicyModalController = (): RefundPolicyModalController => {
  const { isRefundModalOpen, closeRefundModal, bookingToRefund, processRefundAndCancel } = useVenueStore();
  const [reason, setReason] = useState<string>('Customer requested cancellation via phone');
  const [reasonCode, setReasonCode] = useState<string>('CUSTOMER_REQUEST');
  const [managerApprovalCode, setManagerApprovalCode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const paidAmount = useMemo(() => {
    if (!bookingToRefund) return 0;
    return (bookingToRefund.paidPaise || bookingToRefund.amountPaise) / 100;
  }, [bookingToRefund]);

  const isHighValue = useMemo(() => paidAmount > 500, [paidAmount]);

  const refundPercent = 100; // Tier policy window calculation
  const refundAmount = useMemo(() => (paidAmount * refundPercent) / 100, [paidAmount, refundPercent]);
  const retentionFee = useMemo(() => paidAmount - refundAmount, [paidAmount, refundAmount]);

  const handleConfirm = useCallback(async () => {
    if (!bookingToRefund) return;
    setErrorMsg('');

    if (isHighValue && !managerApprovalCode.trim()) {
      setErrorMsg('Manager or Owner approval code is required for cancellations exceeding ₹500.');
      return;
    }

    setIsProcessing(true);
    try {
      const refundPaise = refundAmount * 100;
      await processRefundAndCancel(
        bookingToRefund.id,
        refundPaise,
        reason,
        reasonCode,
        managerApprovalCode.trim()
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Cancellation failed. Please check permissions.');
    } finally {
      setIsProcessing(false);
    }
  }, [bookingToRefund, isHighValue, managerApprovalCode, refundAmount, reason, reasonCode, processRefundAndCancel]);

  return {
    isOpen: isRefundModalOpen,
    booking: bookingToRefund,
    reason,
    setReason,
    reasonCode,
    setReasonCode,
    managerApprovalCode,
    setManagerApprovalCode,
    errorMsg,
    isProcessing,
    paidAmount,
    isHighValue,
    refundPercent,
    refundAmount,
    retentionFee,
    handleConfirm,
    closeModal: closeRefundModal,
  };
};
