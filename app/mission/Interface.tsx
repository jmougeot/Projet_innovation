/**
 * Interface définissant la structure d'une mission
 */
export interface Mission {
  id: string;
  titre: string;
  description: string;
  points: number;
  recurrence: {
    frequence: 'daily' | 'weekly' | 'monthly';
    dateDebut: Date;
  };
}

/**
 * Interface définissant la structure d'une mission collective
 */
export interface CollectiveMission {
  id: string;
  missionId: string;
  targetValue: number;
  currentValue: number;
  userIds: string[];
}

/**
 * Interface définissant un utilisateur (pour les mocks)
 */
export interface User {
  id: string;
  name: string;
}

export interface MissionAssignment {
    missionId: string;
    userIds: string[];        // Plusieurs utilisateurs
    status: Record<string, "pending" | "completed" | "failed">;
    progression: Record<string, number>;
    dateCompletion: Record<string, Date | null>;
  }

export interface MissionGroup {
  id: string;
  missionId: string;
  userIds: string[]; // Liste des utilisateurs participants
  progressionCollective: number; // Progression combinée
  status: "pending" | "completed" | "failed";
  dateCreation: Date;
  dateCompletion?: Date;
}