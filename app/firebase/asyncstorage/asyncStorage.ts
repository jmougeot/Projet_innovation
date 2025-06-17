// ====== EXPORTS PRINCIPAUX ======
export * from './index';
export * from './roomStorage';

// ====== IMPORTS PAR DÉFAUT ======
import storageBase from './index';
import roomStorage from './roomStorage';

// ====== EXPORT PAR DÉFAUT GLOBAL ======
export default {
  // Fonctions de base
  ...storageBase,
  
  // Gestion room
  room: roomStorage
};
