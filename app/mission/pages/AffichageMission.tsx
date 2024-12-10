import React, { useEffect, useState } from 'react';
import { db } from '@/app/firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc, FirestoreError } from 'firebase/firestore';
import MissionCard from '../components/MissionCard';

// Définition du type pour une mission
interface Mission {
  id: string;
  title: string;
  description: string;
  status: string; // Statut de la mission (par exemple, 'à faire', 'en cours', 'fait')
}

// Ajouter cette interface après l'interface Mission
interface MissionCardProps {
  id: string;
  title: string;
  description: string;
  status: string;
  onStateChange: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const AffichageMission: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteMission = async (id: string): Promise<void> => {
    try {
      const missionRef = doc(db, 'missions', id);
      await deleteDoc(missionRef);
      setMissions((prevMissions) => prevMissions.filter((mission) => mission.id !== id));
      setError(null);
    } catch (error) {
      const firebaseError = error as FirestoreError;
      setError(`Erreur lors de la suppression : ${firebaseError.message}`);
      console.error('Erreur lors de la suppression de la mission :', firebaseError);
    }
  };

  useEffect(() => {
    const fetchMissions = async (): Promise<void> => {
      try {
        const missionsCollection = collection(db, 'missions');
        const missionsSnapshot = await getDocs(missionsCollection);
        const missionsList = missionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Mission, 'id'>),
        }));
        setMissions(missionsList);
        setError(null);
      } catch (error) {
        const firebaseError = error as FirestoreError;
        setError(`Erreur lors du chargement : ${firebaseError.message}`);
        console.error('Erreur lors de la récupération des missions :', firebaseError);
      }
    };

    fetchMissions();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string): Promise<void> => {
    try {
      const missionRef = doc(db, 'missions', id);
      await updateDoc(missionRef, { status: newStatus });
      
      setMissions((prevMissions) =>
        prevMissions.map((mission) =>
          mission.id === id ? { ...mission, status: newStatus } : mission
        )
      );
      setError(null);
    } catch (error) {
      const firebaseError = error as FirestoreError;
      setError(`Erreur lors de la mise à jour : ${firebaseError.message}`);
      console.error('Erreur lors de la mise à jour du statut :', firebaseError);
    }
  };

  return (
    <div className="p-5 min-h-screen overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">Liste des Missions</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            {...mission} // Spread des propriétés de base
            onStateChange={handleStatusChange}
            onDelete={handleDeleteMission}
          />
        ))}
      </div>
    </div>
  );
};

export default AffichageMission;
