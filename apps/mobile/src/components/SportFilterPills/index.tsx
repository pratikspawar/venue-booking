import React from 'react';
import { useSportFilterPillsController } from './SportFilterPills.controller';
import { SportFilterPillsView } from './SportFilterPills.view';

export const SportFilterPills: React.FC = () => {
  const controller = useSportFilterPillsController();
  return <SportFilterPillsView controller={controller} />;
};

export { useSportFilterPillsController, getSportIcon } from './SportFilterPills.controller';
export type { SportPillItem, SportFilterPillsController } from './SportFilterPills.controller';
export { SportFilterPillsView } from './SportFilterPills.view';
export { styles as sportFilterPillsStyles } from './SportFilterPills.styles';
