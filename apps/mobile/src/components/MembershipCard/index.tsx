import React from 'react';
import { useMembershipCardController } from './MembershipCard.controller';
import { MembershipCardView } from './MembershipCard.view';

export const MembershipCard: React.FC = () => {
  const controller = useMembershipCardController();
  return <MembershipCardView controller={controller} />;
};

export { useMembershipCardController } from './MembershipCard.controller';
export { MembershipCardView } from './MembershipCard.view';
export { styles as membershipCardStyles } from './MembershipCard.styles';
