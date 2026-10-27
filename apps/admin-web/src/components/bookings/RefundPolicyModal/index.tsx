import React from 'react';
import { useRefundPolicyModalController } from './RefundPolicyModal.controller';
import { RefundPolicyModalView } from './RefundPolicyModal.view';

export const RefundPolicyModal: React.FC = () => {
  const controller = useRefundPolicyModalController();
  return <RefundPolicyModalView controller={controller} />;
};

export { useRefundPolicyModalController } from './RefundPolicyModal.controller';
export type { RefundPolicyModalController } from './RefundPolicyModal.controller';
export { RefundPolicyModalView } from './RefundPolicyModal.view';
export { styles as refundPolicyModalStyles } from './RefundPolicyModal.styles';
