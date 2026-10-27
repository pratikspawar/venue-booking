import React from 'react';
import { useSidebarController } from './Sidebar.controller';
import { SidebarView } from './Sidebar.view';

export const Sidebar: React.FC = () => {
  const controller = useSidebarController();
  return <SidebarView controller={controller} />;
};

export { useSidebarController } from './Sidebar.controller';
export type { SidebarController, LanguageOption } from './Sidebar.controller';
export { SidebarView } from './Sidebar.view';
