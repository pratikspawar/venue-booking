import { Alert } from 'react-native';
import { useCustomerStore } from '../../store/useCustomerStore';
import { ResourceItem, SlotCell } from '../../types';

export interface SlotMatrixController {
  resources: ResourceItem[];
  selectedResource: ResourceItem | null;
  selectResource: (r: ResourceItem) => void;
  availableSlots: SlotCell[];
  selectedSlots: SlotCell[];
  toggleSlot: (slot: SlotCell) => void;
  totalPaise: number;
  beginCheckout: () => Promise<void>;
}

export const useSlotMatrixController = (): SlotMatrixController => {
  const {
    resources,
    selectedResource,
    selectResource,
    availableSlots,
    selectedSlots,
    toggleSlot,
    openCheckout,
  } = useCustomerStore();

  const totalPaise = selectedSlots.reduce((acc, s) => acc + s.pricePaise, 0);

  const beginCheckout = async () => {
    try {
      await openCheckout();
    } catch (error) {
      Alert.alert(
        'Slot unavailable',
        error instanceof Error ? error.message : 'Refresh availability and try again.'
      );
    }
  };

  return {
    resources,
    selectedResource,
    selectResource,
    availableSlots,
    selectedSlots,
    toggleSlot,
    totalPaise,
    beginCheckout,
  };
};
