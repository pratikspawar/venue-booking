import { useState, useCallback } from 'react';
import { api } from '../../services/api';
import { MembershipPlan } from '../../types';

export interface UseAddMembershipPlanModalProps {
  onClose: () => void;
  onPlanCreated: (plan: MembershipPlan) => void;
}

export type UseAddMembershipPlanModalParams = UseAddMembershipPlanModalProps;

export interface UseAddMembershipPlanModalReturn {
  name: string;
  setName: (name: string) => void;
  sportCode: string;
  setSportCode: (sportCode: string) => void;
  priceRupees: string;
  setPriceRupees: (price: string) => void;
  durationDays: string;
  setDurationDays: (days: string) => void;
  discountPercent: string;
  setDiscountPercent: (percent: string) => void;
  freeMinutes: string;
  setFreeMinutes: (minutes: string) => void;
  loading: boolean;
  error: string | null;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

export const useAddMembershipPlanModal = ({
  onClose,
  onPlanCreated,
}: UseAddMembershipPlanModalProps): UseAddMembershipPlanModalReturn => {
  const [name, setName] = useState('');
  const [sportCode, setSportCode] = useState<string>('ALL');
  const [priceRupees, setPriceRupees] = useState('1499');
  const [durationDays, setDurationDays] = useState('30');
  const [discountPercent, setDiscountPercent] = useState('20');
  const [freeMinutes, setFreeMinutes] = useState('120');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName('');
    setSportCode('ALL');
    setPriceRupees('1499');
    setDurationDays('30');
    setDiscountPercent('20');
    setFreeMinutes('120');
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const price = Number(priceRupees);
      if (!name.trim()) {
        setError('Please enter a plan name');
        return;
      }
      if (isNaN(price) || price <= 0) {
        setError('Please enter a valid price in ₹');
        return;
      }

      setLoading(true);
      try {
        const created = await api.createMembershipPlan({
          name: name.trim(),
          sportCode: sportCode === 'ALL' ? null : sportCode,
          pricePaise: Math.round(price * 100),
          durationDays: Number(durationDays) || 30,
          discountPercent: Number(discountPercent) || 0,
          freeMinutes: Number(freeMinutes) || 0,
        });

        onPlanCreated(created);
        resetForm();
        onClose();
      } catch (err: any) {
        setError(err?.message || 'Failed to create membership plan');
      } finally {
        setLoading(false);
      }
    },
    [name, sportCode, priceRupees, durationDays, discountPercent, freeMinutes, onPlanCreated, onClose, resetForm]
  );

  return {
    name,
    setName,
    sportCode,
    setSportCode,
    priceRupees,
    setPriceRupees,
    durationDays,
    setDurationDays,
    discountPercent,
    setDiscountPercent,
    freeMinutes,
    setFreeMinutes,
    loading,
    error,
    handleSubmit,
    resetForm,
  };
};
