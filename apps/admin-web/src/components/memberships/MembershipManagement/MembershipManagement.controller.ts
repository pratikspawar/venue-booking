import { useMembershipManagement, UseMembershipManagementReturn } from '../useMembershipManagement';

export type MembershipManagementController = UseMembershipManagementReturn;

export const useMembershipManagementController = (): MembershipManagementController => {
  return useMembershipManagement();
};
