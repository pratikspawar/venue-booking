import { useVenueStore } from '../../store/useVenueStore';
import { useTranslation } from '../../locales';

export interface HeaderController {
  title: string;
  sub: string;
  totalShiftRevenue: number;
  openQrCheckinModal: () => void;
  openWalkinModal: () => void;
}

export const useHeaderController = (): HeaderController => {
  const { activeTab, resources, calculateCurrentBill, openWalkinModal, openQrCheckinModal } = useVenueStore();
  const { t } = useTranslation();

  const totalShiftRevenue = resources.reduce((acc, r) => acc + calculateCurrentBill(r), 18450);

  const getTitleAndSubtitle = () => {
    switch (activeTab) {
      case 'desk':
        return {
          title: t('desk_title'),
          sub: t('desk_subtitle'),
        };
      case 'timeline':
        return {
          title: t('timeline_title'),
          sub: t('timeline_subtitle'),
        };
      case 'resources':
        return {
          title: t('resources_title'),
          sub: t('resources_subtitle'),
        };
      case 'bookings':
        return {
          title: t('bookings_title'),
          sub: t('bookings_subtitle'),
        };
      case 'earnings':
        return {
          title: t('earnings_title'),
          sub: t('earnings_subtitle'),
        };
      case 'reports':
        return {
          title: t('earnings_title'),
          sub: t('desk_shift_summary'),
        };
      case 'staff':
        return {
          title: t('staff_title'),
          sub: t('staff_subtitle'),
        };
      default:
        return {
          title: t('desk_title'),
          sub: t('desk_subtitle'),
        };
    }
  };

  const { title, sub } = getTitleAndSubtitle();

  return {
    title,
    sub,
    totalShiftRevenue,
    openQrCheckinModal,
    openWalkinModal,
  };
};
