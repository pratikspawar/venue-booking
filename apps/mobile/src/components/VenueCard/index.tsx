import React from 'react';
import { VenueItem } from '../../types';
import { useVenueCardController } from './VenueCard.controller';
import { VenueCardView } from './VenueCard.view';

export interface VenueCardProps {
  venue: VenueItem;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue }) => {
  const controller = useVenueCardController(venue);
  return <VenueCardView controller={controller} />;
};

export { useVenueCardController, getVenueSportTagLabel } from './VenueCard.controller';
export type { VenueCardController } from './VenueCard.controller';
export { VenueCardView } from './VenueCard.view';
export { styles as venueCardStyles } from './VenueCard.styles';
