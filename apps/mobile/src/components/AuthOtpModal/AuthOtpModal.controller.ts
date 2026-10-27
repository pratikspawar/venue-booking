import { useState } from 'react';
import { useCustomerStore } from '../../store/useCustomerStore';
import { mobileApi } from '../../services/api';

export type AuthOtpStep = 'PHONE' | 'OTP';

export interface AuthOtpModalController {
  isAuthOpen: boolean;
  step: AuthOtpStep;
  phone: string;
  otp: string;
  isLoading: boolean;
  error: string | null;
  setPhone: (val: string) => void;
  setOtp: (val: string) => void;
  handleSendOtp: () => Promise<void>;
  handleVerifyOtp: () => Promise<void>;
  closeAuth: () => void;
}

export const useAuthOtpModalController = (): AuthOtpModalController => {
  const { isAuthOpen, closeAuth, loginUser } = useCustomerStore();
  const [step, setStep] = useState<AuthOtpStep>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) return;
    setIsLoading(true);
    setError(null);
    try {
      await mobileApi.requestOtp('+91' + phone);
      setStep('OTP');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send an OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) return;
    setIsLoading(true);
    setError(null);
    try {
      await loginUser('+91' + phone, otp);
      setStep('PHONE');
      setPhone('');
      setOtp('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    closeAuth();
  };

  return {
    isAuthOpen,
    step,
    phone,
    otp,
    isLoading,
    error,
    setPhone,
    setOtp,
    handleSendOtp,
    handleVerifyOtp,
    closeAuth: handleClose,
  };
};
