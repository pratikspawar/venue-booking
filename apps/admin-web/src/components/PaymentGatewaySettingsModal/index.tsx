import React from 'react';
import { usePaymentGatewaySettingsModalController } from './PaymentGatewaySettingsModal.controller';
import { PaymentGatewaySettingsModalView } from './PaymentGatewaySettingsModal.view';

export interface PaymentGatewaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentGatewaySettingsModal: React.FC<PaymentGatewaySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const controller = usePaymentGatewaySettingsModalController(isOpen);
  return (
    <PaymentGatewaySettingsModalView
      isOpen={isOpen}
      onClose={onClose}
      controller={controller}
    />
  );
};

export { usePaymentGatewaySettingsModalController } from './PaymentGatewaySettingsModal.controller';
export type { PaymentGatewaySettingsModalController } from './PaymentGatewaySettingsModal.controller';
export { PaymentGatewaySettingsModalView } from './PaymentGatewaySettingsModal.view';
