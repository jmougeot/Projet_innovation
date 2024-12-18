import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { db } from '@/app/firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc, FirestoreError } from 'firebase/firestore';
import MissionCard from '../mission/MissionCard';

interface Mission {
  id: string;
  title: string;
  description: string;
  status: string;
}

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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Liste des Missions</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.gridContainer}>
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              {...mission}
              onStateChange={handleStatusChange}
              onDelete={handleDeleteMission}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
});

export default AffichageMission;
