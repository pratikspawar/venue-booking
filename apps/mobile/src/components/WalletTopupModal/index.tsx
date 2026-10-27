import React from 'react';
import { useWalletTopupController } from './WalletTopupModal.controller';
import { WalletTopupModalView } from './WalletTopupModal.view';

export const WalletTopupModal: React.FC = () => {
  const controller = useWalletTopupController();
  return <WalletTopupModalView controller={controller} />;
};

export { useWalletTopupController } from './WalletTopupModal.controller';
export { WalletTopupModalView } from './WalletTopupModal.view';
export { styles as walletTopupStyles } from './WalletTopupModal.styles';
