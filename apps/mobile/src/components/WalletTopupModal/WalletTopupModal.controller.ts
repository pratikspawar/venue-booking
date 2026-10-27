import { useState, useCallback, useMemo } from 'react';
import { useCustomerStore } from '../../store/useCustomerStore';
import { useTranslation } from '../../locales';
import { WalletTransaction } from '../../types';

export interface WalletTopupController {
  isWalletOpen: boolean;
  currentBalance: string;
  amountStr: string;
  setAmountStr: (val: string) => void;
  isLoading: boolean;
  error: string | null;
  successMsg: string | null;
  quickAmounts: number[];
  walletTransactions: WalletTransaction[];
  handleQuickSelect: (amount: number) => void;
  handleTopup: () => Promise<void>;
  handleClose: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}

export const useWalletTopupController = (): WalletTopupController => {
  const { isWalletOpen, closeWalletModal, user, walletTransactions, topupWallet } = useCustomerStore();
  const { t } = useTranslation();

  const [amountStr, setAmountStrState] = useState('500');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const quickAmounts = useMemo(() => [200, 500, 1000, 2000], []);

  const currentBalance = useMemo(() => {
    return user ? (user.walletBalancePaise / 100).toFixed(2) : '0.00';
  }, [user]);

  const setAmountStr = useCallback((val: string) => {
    setAmountStrState(val.replace(/[^0-9]/g, ''));
    setError(null);
  }, []);

  const handleQuickSelect = useCallback((amount: number) => {
    setAmountStrState(String(amount));
    setError(null);
  }, []);

  const handleTopup = useCallback(async () => {
    const amount = Number(amountStr);
    if (isNaN(amount) || amount < 100) {
      setError('Minimum top-up amount is ₹100');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await topupWallet(amount);
      setSuccessMsg(`Successfully added ₹${amount} to wallet!`);
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (e: any) {
      setError(e?.message || 'Wallet top-up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [amountStr, topupWallet]);

  return {
    isWalletOpen,
    currentBalance,
    amountStr,
    setAmountStr,
    isLoading,
    error,
    successMsg,
    quickAmounts,
    walletTransactions,
    handleQuickSelect,
    handleTopup,
    handleClose: closeWalletModal,
    t,
  };
};
