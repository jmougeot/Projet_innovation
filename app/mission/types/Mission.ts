import {Plat}  from '@/app/firebase/firebaseMenu';

export interface Mission {
  id: string;
  titre: string;
  description?: string;
  points: number;
  recurrence: {
    frequence: 'daily' | 'weekly' | 'monthly';
    dateDebut: Date;
  };
  plat?: Plat; // Plat associé à la mission (optionnel)
  targetValue?: number; // Valeur cible pour la progression (optionnel)
  UserId : User["id"][]; // Liste des utilisateurs assignés à la mission
}

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
    plat: Plat;
  }
export default {
};