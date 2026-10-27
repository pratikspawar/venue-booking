import React from 'react';
import { useSlotMatrixController } from './SlotMatrix.controller';
import { SlotMatrixView } from './SlotMatrix.view';

export const SlotMatrix: React.FC = () => {
  const controller = useSlotMatrixController();
  return <SlotMatrixView controller={controller} />;
};

export { useSlotMatrixController } from './SlotMatrix.controller';
export type { SlotMatrixController } from './SlotMatrix.controller';
export { SlotMatrixView } from './SlotMatrix.view';
export { styles as slotMatrixStyles } from './SlotMatrix.styles';
