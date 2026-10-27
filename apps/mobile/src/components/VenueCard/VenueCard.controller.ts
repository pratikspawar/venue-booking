import { useCustomerStore } from '../../store/useCustomerStore';
import { VenueItem } from '../../types';

export const getVenueSportTagLabel = (sport: string): string => {
  const c = sport.toUpperCase();
  if (c.includes('PLAYSTATION')) return '🎮 PS5 Lounges';
  if (c.includes('POOL') || c.includes('SNOOKER')) return '🎱 Pool / Snooker';
  if (c.includes('TURF')) return '⚽ Turf';
  if (c.includes('CARROM')) return '🎯 Carrom';
  if (c.includes('BADMINTON')) return '🏸 Badminton';
  if (c.includes('PICKLEBALL')) return '🏓 Pickleball';
  if (c.includes('VR')) return '🥽 VR Gaming';
  return `🏆 ${sport}`;
};

export interface VenueCardController {
  venue: VenueItem;
  handleSelect: () => void;
  getTagLabel: (sport: string) => string;
}

export const useVenueCardController = (venue: VenueItem): VenueCardController => {
  const { selectVenue } = useCustomerStore();

  const handleSelect = () => {
    selectVenue(venue);
  };

  return {
    venue,
    handleSelect,
    getTagLabel: getVenueSportTagLabel,
  };
};
