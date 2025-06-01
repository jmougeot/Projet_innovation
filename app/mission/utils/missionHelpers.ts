import { Mission } from '../types';

/**
 * Filtre les missions selon les critères spécifiés
 */
export const filterMissions = (
  missions: Mission[],
  filters: {
    searchQuery?: string;
    recurrence?: 'daily' | 'weekly' | 'monthly';
    minPoints?: number;
    maxPoints?: number;
  }
): Mission[] => {
  return missions.filter(mission => {
    // Filtrage par recherche textuelle
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = mission.titre.toLowerCase().includes(query);
      const matchesDescription = mission.description.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesDescription) {
        return false;
      }
    }

    // Filtrage par récurrence
    if (filters.recurrence && mission.recurrence.frequence !== filters.recurrence) {
      return false;
    }

    // Filtrage par points minimum
    if (filters.minPoints !== undefined && mission.points < filters.minPoints) {
      return false;
    }

    // Filtrage par points maximum
    if (filters.maxPoints !== undefined && mission.points > filters.maxPoints) {
      return false;
    }

    return true;
  });
};

/**
 * Trie une liste de missions selon différents critères
 */
export const sortMissions = (
  missions: Mission[],
  sortBy: 'titre' | 'points' | 'recurrence' | 'dateDebut',
  sortOrder: 'asc' | 'desc' = 'asc'
): Mission[] => {
  return [...missions].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'titre':
        comparison = a.titre.localeCompare(b.titre);
        break;
      case 'points':
        comparison = a.points - b.points;
        break;
      case 'recurrence':
        const frequenceOrder = { daily: 1, weekly: 2, monthly: 3 };
        comparison = frequenceOrder[a.recurrence.frequence] - frequenceOrder[b.recurrence.frequence];
        break;
      case 'dateDebut':
        comparison = new Date(a.recurrence.dateDebut).getTime() - new Date(b.recurrence.dateDebut).getTime();
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });
};

/**
 * Obtient la couleur associée à une fréquence de récurrence
 */
export const getRecurrenceColor = (frequence: 'daily' | 'weekly' | 'monthly'): string => {
  const colors = {
    daily: '#4CAF50',    // Vert - quotidien
    weekly: '#FF9800',   // Orange - hebdomadaire
    monthly: '#2196F3'   // Bleu - mensuel
  };
  return colors[frequence];
};

/**
 * Obtient le libellé français d'une fréquence de récurrence
 */
export const getRecurrenceLabel = (frequence: 'daily' | 'weekly' | 'monthly'): string => {
  const labels = {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel'
  };
  return labels[frequence];
};

/**
 * Calcule les statistiques d'un ensemble de missions
 */
export const calculateMissionStats = (missions: Mission[]) => {
  const total = missions.length;
  const dailyMissions = missions.filter(m => m.recurrence.frequence === 'daily').length;
  const weeklyMissions = missions.filter(m => m.recurrence.frequence === 'weekly').length;
  const monthlyMissions = missions.filter(m => m.recurrence.frequence === 'monthly').length;
  const totalPoints = missions.reduce((sum, mission) => sum + mission.points, 0);
  const averagePoints = total > 0 ? Math.round(totalPoints / total) : 0;

  return {
    total,
    dailyMissions,
    weeklyMissions,
    monthlyMissions,
    totalPoints,
    averagePoints
  };
};

/**
 * Groupe les missions par fréquence de récurrence
 */
export const groupMissionsByRecurrence = (missions: Mission[]): Record<string, Mission[]> => {
  return missions.reduce((groups, mission) => {
    const frequence = mission.recurrence.frequence;
    if (!groups[frequence]) {
      groups[frequence] = [];
    }
    groups[frequence].push(mission);
    return groups;
  }, {} as Record<string, Mission[]>);
};

/**
 * Valide les données d'une mission
 */
export const validateMissionData = (mission: Partial<Mission>): string[] => {
  const errors: string[] = [];

  if (!mission.titre?.trim()) {
    errors.push('Le titre est requis');
  }

  if (!mission.description?.trim()) {
    errors.push('La description est requise');
  }

  if (mission.points === undefined || mission.points <= 0) {
    errors.push('Les points doivent être un nombre positif');
  }

  if (!mission.recurrence) {
    errors.push('La récurrence est requise');
  } else {
    if (!mission.recurrence.frequence || !['daily', 'weekly', 'monthly'].includes(mission.recurrence.frequence)) {
      errors.push('La fréquence de récurrence est invalide');
    }

    if (!mission.recurrence.dateDebut) {
      errors.push('La date de début est requise');
    } else if (new Date(mission.recurrence.dateDebut) < new Date()) {
      errors.push('La date de début ne peut pas être dans le passé');
    }
  }

  if (mission.targetValue !== undefined && mission.targetValue <= 0) {
    errors.push('La valeur cible doit être positive');
  }

  return errors;
};

/**
 * Génère un ID unique pour une nouvelle mission
 */
export const generateMissionId = (): string => {
  return `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calcule la prochaine occurrence d'une mission récurrente
 */
export const getNextOccurrence = (mission: Mission): Date => {
  const currentDate = new Date();
  const startDate = new Date(mission.recurrence.dateDebut);
  
  if (startDate > currentDate) {
    return startDate;
  }

  const nextDate = new Date(startDate);

  switch (mission.recurrence.frequence) {
    case 'daily':
      const daysDiff = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      nextDate.setDate(startDate.getDate() + daysDiff);
      break;
    case 'weekly':
      const weeksDiff = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      nextDate.setDate(startDate.getDate() + (weeksDiff * 7));
      break;
    case 'monthly':
      const monthsDiff = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      nextDate.setMonth(startDate.getMonth() + monthsDiff);
      break;
  }

  return nextDate;
};

/**
 * Vérifie si une mission est active aujourd'hui
 */
export const isMissionActiveToday = (mission: Mission): boolean => {
  const today = new Date();
  const startDate = new Date(mission.recurrence.dateDebut);
  
  if (startDate > today) {
    return false;
  }

  const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  switch (mission.recurrence.frequence) {
    case 'daily':
      return true;
    case 'weekly':
      return daysDiff % 7 === 0;
    case 'monthly':
      return today.getDate() === startDate.getDate();
    default:
      return false;
  }
};
