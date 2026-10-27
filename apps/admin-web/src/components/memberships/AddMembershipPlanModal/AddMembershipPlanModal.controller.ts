import { useAddMembershipPlanModal, UseAddMembershipPlanModalParams, UseAddMembershipPlanModalReturn } from '../useAddMembershipPlanModal';

export type AddMembershipPlanModalController = UseAddMembershipPlanModalReturn;
export type AddMembershipPlanModalControllerParams = UseAddMembershipPlanModalParams;

export const useAddMembershipPlanModalController = (
  params: AddMembershipPlanModalControllerParams
): AddMembershipPlanModalController => {
  return useAddMembershipPlanModal(params);
};
