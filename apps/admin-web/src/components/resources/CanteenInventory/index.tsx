import React from 'react';
import { useCanteenInventoryController } from './CanteenInventory.controller';
import { CanteenInventoryView } from './CanteenInventory.view';

export const CanteenInventory: React.FC = () => {
  const controller = useCanteenInventoryController();
  return <CanteenInventoryView controller={controller} />;
};

export { useCanteenInventoryController } from './CanteenInventory.controller';
export type { CanteenInventoryController } from './CanteenInventory.controller';
export { CanteenInventoryView } from './CanteenInventory.view';
