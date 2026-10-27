import React from 'react';
import { useCheckoutModalController } from './CheckoutModal.controller';
import { CheckoutModalView } from './CheckoutModal.view';

export const CheckoutModal: React.FC = () => {
  const controller = useCheckoutModalController();
  return <CheckoutModalView controller={controller} />;
};

export { useCheckoutModalController } from './CheckoutModal.controller';
export { CheckoutModalView } from './CheckoutModal.view';
export { styles as checkoutModalStyles } from './CheckoutModal.styles';
