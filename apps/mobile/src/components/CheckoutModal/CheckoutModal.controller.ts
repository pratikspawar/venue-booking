import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useCustomerStore } from '../../store/useCustomerStore';
import { VenueItem, ResourceItem, SlotCell } from '../../types';

export interface CheckoutModalController {
  isCheckoutOpen: boolean;
  selectedVenue: VenueItem | null;
  selectedResource: ResourceItem | null;
  selectedSlots: SlotCell[];
  selectedDate: string;
  checkoutBooking: any | null;
  totalPaise: number;
  paymentMode: 'ONLINE' | 'PAY_AT_VENUE';
  setPaymentMode: (mode: 'ONLINE' | 'PAY_AT_VENUE') => void;
  isProcessing: boolean;
  error: string | null;
  secondsLeft: number | null;
  couponCode: string;
  setCouponCode: (val: string) => void;
  couponSuccess: string | null;
  couponError: string | null;
  isApplyingCoupon: boolean;
  handleApplyCoupon: () => Promise<void>;
  handleConfirm: () => Promise<void>;
  handleClose: () => Promise<void>;
  clearCouponAlerts: () => void;
}

export const useCheckoutModalController = (): CheckoutModalController => {
  const {
    isCheckoutOpen,
    closeCheckout,
    selectedVenue,
    selectedResource,
    selectedSlots,
    selectedDate,
    confirmBooking,
    checkoutBooking,
    applyCoupon,
  } = useCustomerStore();

  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'PAY_AT_VENUE'>('ONLINE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const clearCouponAlerts = () => {
    setCouponError(null);
    setCouponSuccess(null);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);
    try {
      const res = await applyCoupon(couponCode.trim().toUpperCase());
      if (res.valid) {
        setCouponSuccess(`Coupon ${couponCode.trim().toUpperCase()} applied! Saved ₹${((res.discountPaise || 0) / 100).toFixed(0)}`);
      } else {
        setCouponError(res.message || 'Invalid coupon code');
      }
    } catch (e) {
      setCouponError(e instanceof Error ? e.message : 'Coupon could not be applied');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  useEffect(() => {
    if (!isCheckoutOpen || !checkoutBooking?.holdExpiresAt) return;
    const update = () =>
      setSecondsLeft(
        Math.max(
          0,
          Math.ceil((Date.parse(checkoutBooking.holdExpiresAt) - Date.now()) / 1000)
        )
      );
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [isCheckoutOpen, checkoutBooking?.holdExpiresAt]);

  const totalPaise = checkoutBooking?.amountPaise ?? 0;

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await confirmBooking(paymentMode);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not reserve those slots. Refresh availability and try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = async () => {
    try {
      await closeCheckout();
    } catch (e) {
      Alert.alert(
        'Could not release hold',
        e instanceof Error ? e.message : 'Please try again.'
      );
    }
  };

  return {
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
  };
};
