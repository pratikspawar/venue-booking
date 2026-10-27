import { useEffect } from 'react';
import { useCustomerStore } from '../../store/useCustomerStore';

export interface SportPillItem {
  code: string;
  label: string;
  icon: string;
}

export const getSportIcon = (code: string): string => {
  const c = code.toUpperCase();
  if (c.includes('PLAYSTATION') || c.includes('PS5') || c.includes('CONSOLE')) return '🎮';
  if (c.includes('POOL') || c.includes('SNOOKER') || c.includes('BILLIARD')) return '🎱';
  if (c.includes('TURF') || c.includes('FOOTBALL') || c.includes('SOCCER')) return '⚽';
  if (c.includes('CARROM')) return '🎯';
  if (c.includes('BADMINTON')) return '🏸';
  if (c.includes('PICKLEBALL')) return '🏓';
  if (c.includes('TENNIS')) return '🎾';
  if (c.includes('VR')) return '🥽';
  if (c.includes('BOWLING')) return '🎳';
  if (c.includes('CRICKET')) return '🏏';
  return '🏆';
};

export interface SportFilterPillsController {
  selectedSport: string;
  items: SportPillItem[];
  selectSport: (code: string) => void;
}

export const useSportFilterPillsController = (): SportFilterPillsController => {
  const { selectedSport, setSelectedSport, sports, fetchSports } = useCustomerStore();

  useEffect(() => {
    fetchSports();
  }, []);

  const items: SportPillItem[] = [
    { code: 'ALL', label: 'All Sports', icon: '⚡' },
    ...sports.map((s) => ({
      code: s.code,
      label: s.nameEn,
      icon: s.icon || getSportIcon(s.code),
    })),
  ];

  return {
    selectedSport,
    items,
    selectSport: setSelectedSport,
  };
};
