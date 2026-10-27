import React from 'react';
import { useAuthOtpModalController } from './AuthOtpModal.controller';
import { AuthOtpModalView } from './AuthOtpModal.view';

export const AuthOtpModal: React.FC = () => {
  const controller = useAuthOtpModalController();
  return <AuthOtpModalView controller={controller} />;
};

export { useAuthOtpModalController } from './AuthOtpModal.controller';
export { AuthOtpModalView } from './AuthOtpModal.view';
export { styles as authOtpModalStyles } from './AuthOtpModal.styles';
