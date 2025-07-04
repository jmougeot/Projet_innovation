// Export centralisé des styles
import { commonStyles, modalStyles } from './commonStyles';
import { missionCardStyles } from './missionCardStyles';
import { pageStyles } from './pageStyles';

export { 
  commonStyles, 
  modalStyles, 
  missionCardStyles, 
  pageStyles 
};

// Export de tous les styles en un seul objet pour faciliter l'usage
export const styles = {
  common: commonStyles,
  missionCard: missionCardStyles,
  page: pageStyles,
};

// Default export to prevent Expo Router warnings
export default function StylesIndex() {
  return null;
}
