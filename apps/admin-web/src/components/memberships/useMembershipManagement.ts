import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../services/api';
import { MembershipPlan, CustomerMembership } from '../../types';

export type MembershipSubTab = 'PLANS' | 'LEDGER';

export interface UseMembershipManagementReturn {
  activeSubTab: MembershipSubTab;
  setActiveSubTab: (tab: MembershipSubTab) => void;
  plans: MembershipPlan[];
  members: CustomerMembership[];
  filteredMembers: CustomerMembership[];
  activeSubscribersCount: number;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  togglingId: number | null;
  loading: boolean;
  fetchPlans: () => Promise<void>;
  fetchMembersLedger: () => Promise<void>;
  refreshAll: () => Promise<void>;
  handleToggle: (planId: number) => Promise<void>;
  handlePlanCreated: (newPlan: MembershipPlan) => void;
}

export const useMembershipManagement = (): UseMembershipManagementReturn => {
  const [activeSubTab, setActiveSubTab] = useState<MembershipSubTab>('PLANS');
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [members, setMembers] = useState<CustomerMembership[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const data = await api.getMembershipPlans();
      setPlans(data);
    } catch {
      // Fallback mock data for demo / offline
      setPlans([
        {
          id: 1,
          name: 'Gold VIP Pass',
          sportCode: null,
          pricePaise: 199900,
          priceRupees: 1999,
          durationDays: 30,
          discountPercent: 20,
          freeMinutes: 120,
          active: true,
        },
        {
          id: 2,
          name: 'Weekend Turf Club',
          sportCode: 'TURF',
          pricePaise: 299900,
          priceRupees: 2999,
          durationDays: 30,
          discountPercent: 15,
          freeMinutes: 180,
          active: true,
        },
        {
          id: 3,
          name: 'Snooker Enthusiast Pass',
          sportCode: 'POOL',
          pricePaise: 129900,
          priceRupees: 1299,
          durationDays: 30,
          discountPercent: 25,
          freeMinutes: 60,
          active: false,
        },
      ]);
    }
  }, []);

  const fetchMembersLedger = useCallback(async () => {
    try {
      const data = await api.getCustomerMembershipsLedger();
      setMembers(data);
    } catch {
      // Fallback mock for demo
      setMembers([
        {
          id: 101,
          userId: 42,
          planId: 1,
          planName: 'Gold VIP Pass',
          sportCode: null,
          discountPercent: 20,
          remainingFreeMinutes: 90,
          startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 25 * 86400000).toISOString(),
          status: 'ACTIVE',
        },
        {
          id: 102,
          userId: 58,
          planId: 2,
          planName: 'Weekend Turf Club',
          sportCode: 'TURF',
          discountPercent: 15,
          remainingFreeMinutes: 180,
          startDate: new Date(Date.now() - 12 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 18 * 86400000).toISOString(),
          status: 'ACTIVE',
        },
      ]);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPlans(), fetchMembersLedger()]);
    } finally {
      setLoading(false);
    }
  }, [fetchPlans, fetchMembersLedger]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleToggle = useCallback(async (planId: number) => {
    setTogglingId(planId);
    try {
      const updated = await api.toggleMembershipPlan(planId);
      setPlans((prev) => prev.map((p) => (p.id === planId ? updated : p)));
    } catch {
      // Optimistic fallback
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, active: !p.active } : p))
      );
    } finally {
      setTogglingId(null);
    }
  }, []);

  const handlePlanCreated = useCallback((newPlan: MembershipPlan) => {
    setPlans((prev) => [newPlan, ...prev]);
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.planName.toLowerCase().includes(q) ||
        String(m.userId).includes(q) ||
        (m.sportCode && m.sportCode.toLowerCase().includes(q))
    );
  }, [members, searchQuery]);

  const activeSubscribersCount = useMemo(() => {
    return members.filter((m) => m.status === 'ACTIVE').length;
  }, [members]);

  return {
    activeSubTab,
    setActiveSubTab,
    plans,
    members,
    filteredMembers,
    activeSubscribersCount,
    isModalOpen,
    openModal,
    closeModal,
    searchQuery,
    setSearchQuery,
    togglingId,
    loading,
    fetchPlans,
    fetchMembersLedger,
    refreshAll,
    handleToggle,
    handlePlanCreated,
  };
};
