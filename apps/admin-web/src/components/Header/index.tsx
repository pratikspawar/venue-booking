import React from 'react';
import { useHeaderController } from './Header.controller';
import { HeaderView } from './Header.view';

export const Header: React.FC = () => {
  const controller = useHeaderController();
  return <HeaderView controller={controller} />;
};

export { useHeaderController } from './Header.controller';
export type { HeaderController } from './Header.controller';
export { HeaderView } from './Header.view';
