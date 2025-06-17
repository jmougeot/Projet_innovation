import { Table as TableType } from '@/app/firebase/firebaseTables';
import { useWorkspaceSize } from '../../Workspace';

// Hook pour obtenir les dimensions du workspace au lieu de l'écran
export const useWorkspaceDimensions = () => {
  const { size: workspaceSize, screenWidth, screenHeight } = useWorkspaceSize();
  
  return {
    width: workspaceSize,
    height: workspaceSize,
    screenWidth,
    screenHeight
  };
};

// Fonctions utilitaires communes
export const getStatusColor = (status: TableType['status']) => {
  switch (status) {
    case 'libre': return '#4CAF50';
    case 'occupee': return '#EFBC51';
    case 'reservee': return '#CAE1EF';
  }
};

export const getStatusText = (status: TableType['status']) => {
  switch (status) {
    case 'libre': return 'Libre';
    case 'occupee': return 'Occupée';
    case 'reservee': return 'Réservée';
  }
};

export const getNextStatus = (currentStatus: TableType['status']): TableType['status'] => {
  const statuses: TableType['status'][] = ['libre', 'reservee', 'occupee'];
  const currentIndex = statuses.indexOf(currentStatus);
  return statuses[(currentIndex + 1) % statuses.length];
};

export default {
  useWorkspaceDimensions,
  getStatusColor,
  getStatusText,
  getNextStatus,
};

