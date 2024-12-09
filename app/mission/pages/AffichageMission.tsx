import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/firebaseConfig'; // Import de la configuration Firebase
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'; // Import des fonctions Firestore
import MissionCard from '../components/MissionCard';

// Définition du type pour une mission
interface Mission {
  id: string;
  title: string;
  description: string;
  status: string; // Statut de la mission (par exemple, 'à faire', 'en cours', 'fait')
}

const Home: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]); // État pour stocker les missions

  // Fonction pour supprimer une mission
  const handleDeleteMission = async (id: string): Promise<void> => {
    try {
      // Supprimer la mission dans Firebase
      const missionRef = doc(db, 'missions', id);
      await deleteDoc(missionRef);

      // Supprimer localement
      setMissions((prevMissions) => prevMissions.filter((mission) => mission.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression de la mission :', error);
    }
  };

  // Fonction pour récupérer les missions depuis Firebase
  useEffect(() => {
    const fetchMissions = async (): Promise<void> => {
      try {
        const missionsCollection = collection(db, 'missions'); // Référence à la collection "missions"
        const missionsSnapshot = await getDocs(missionsCollection); // Récupération des documents
        const missionsList: Mission[] = missionsSnapshot.docs.map((doc) => ({
          id: doc.id, // Récupère l'ID unique du document
          ...(doc.data() as Omit<Mission, 'id'>), // Cast les données au type Mission, sans inclure `id` (ajouté séparément)
        }));
        setMissions(missionsList); // Met à jour l'état avec les données récupérées
      } catch (error) {
        console.error('Erreur lors de la récupération des missions :', error);
      }
    };

    fetchMissions(); // Appelle la fonction pour récupérer les missions
  }, []); // Le tableau vide signifie que cette fonction est exécutée une seule fois, au montage du composant

  // Fonction pour gérer le changement de statut d'une mission
  const handleStatusChange = async (id: string, newStatus: string): Promise<void> => {
    try {
      // Mettre à jour le statut dans Firebase
      const missionRef = doc(db, 'missions', id); // Référence au document correspondant
      await updateDoc(missionRef, { status: newStatus }); // Mise à jour du champ `status`

      // Mettre à jour localement pour éviter de recharger les données
      setMissions((prevMissions) =>
        prevMissions.map((mission) =>
          mission.id === id ? { ...mission, status: newStatus } : mission
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut :', error);
    }
  };

  return (
    <div style={{ padding: '20px', overflowY: 'auto', height: '100vh' }}>
      <h1>Liste des Missions</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            id={mission.id}
            title={mission.title}
            description={mission.description}
            state={mission.status} // Transfert du champ `status` comme `state` au composant MissionCard
            onStateChange={handleStatusChange} // Mise à jour du statut
            onDelete={() => handleDeleteMission(mission.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
