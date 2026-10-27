import React from 'react';
import { useMembershipManagementController } from './MembershipManagement.controller';
import { MembershipManagementView } from './MembershipManagement.view';

export const MembershipManagement: React.FC = () => {
  const controller = useMembershipManagementController();
  return <MembershipManagementView controller={controller} />;
};

export { useMembershipManagementController } from './MembershipManagement.controller';
export type { MembershipManagementController } from './MembershipManagement.controller';
export { MembershipManagementView } from './MembershipManagement.view';
