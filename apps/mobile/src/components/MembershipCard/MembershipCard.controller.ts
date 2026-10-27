import { useCallback, useMemo } from 'react';
import { useCustomerStore } from '../../store/useCustomerStore';

export interface MembershipCardController {
  hasActiveMembership: boolean;
  title: string;
  subtitle: string;
  handleJoinVip: () => void;
}

export const useMembershipCardController = (): MembershipCardController => {
  const { user, activeMembership, membershipPlans, buyMembership, openAuth } = useCustomerStore();

  const hasActiveMembership = Boolean(activeMembership);

  const title = useMemo(() => {
    return activeMembership ? activeMembership.planName : 'Apex VIP Membership';
  }, [activeMembership]);

  const subtitle = useMemo(() => {
    if (activeMembership) {
      return `${activeMembership.discountPercent}% Auto Discount • ${activeMembership.remainingFreeMinutes} Mins Free Time`;
    }
    return 'Unlock up to 25% automatic checkout discounts & complimentary hours.';
  }, [activeMembership]);

  const handleJoinVip = useCallback(() => {
    if (!user) {
      openAuth();
      return;
    }
    if (membershipPlans.length > 0) {
      buyMembership(membershipPlans[0].id);
    }
  }, [user, openAuth, membershipPlans, buyMembership]);

  return {
    hasActiveMembership,
    title,
    subtitle,
    handleJoinVip,
  };
};
