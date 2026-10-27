import React from 'react';
import { MembershipPlan } from '../../../types';
import { useAddMembershipPlanModalController } from './AddMembershipPlanModal.controller';
import { AddMembershipPlanModalView } from './AddMembershipPlanModal.view';

export interface AddMembershipPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: (plan: MembershipPlan) => void;
  sports?: Array<{ code: string; nameEn: string }>;
}

export const AddMembershipPlanModal: React.FC<AddMembershipPlanModalProps> = ({
  isOpen,
  onClose,
  onPlanCreated,
  sports = [],
}) => {
  const controller = useAddMembershipPlanModalController({ onClose, onPlanCreated });
  return (
    <AddMembershipPlanModalView
      isOpen={isOpen}
      onClose={onClose}
      sports={sports}
      controller={controller}
    />
  );
};

export { useAddMembershipPlanModalController } from './AddMembershipPlanModal.controller';
export type { AddMembershipPlanModalController } from './AddMembershipPlanModal.controller';
export { AddMembershipPlanModalView } from './AddMembershipPlanModal.view';
