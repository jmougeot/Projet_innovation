import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getUserMissions } from '../firebase/firebaseMission';
import { getAuth } from 'firebase/auth';
import { getMission } from '../firebase/firebaseMission';
import { MissionStackParamList } from './index';
import { Mission } from './Interface';
import { Ionicons } from '@expo/vector-icons';

// Interface pour les missions de l'utilisateur avec données étendues
interface UserMissionWithDetails {
  id: string;
  userId: string;
  missionId: string;
  status: "pending" | "completed" | "failed";
  progression: number;
  dateAssigned: any;
  dateCompletion?: any;
  isPartOfCollective?: boolean;
  collectiveMissionId?: string;
  missionDetails?: Mission | null;
}

const UserMissionsPage = () => {
  const [userMissions, setUserMissions] = useState<UserMissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<StackNavigationProp<MissionStackParamList>>();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Fonction pour charger les missions de l'utilisateur
  const loadUserMissions = async () => {
    if (!currentUser) {
      Alert.alert('Erreur', 'Vous devez être connecté pour voir vos missions');
      setLoading(false);
      return;
    }

    try {
      // Récupérer les missions de l'utilisateur
      const missions = await getUserMissions(currentUser.uid);
      
      // Pour chaque mission, récupérer les détails complets
      const missionsWithDetails = await Promise.all(
        missions.map(async (mission) => {
          const missionDetails = await getMission(mission.missionId);
          return { ...mission, missionDetails };
        })
      );
      
      setUserMissions(missionsWithDetails);
    } catch (error) {
      console.error('Erreur lors de la récupération des missions:', error);
      Alert.alert('Erreur', 'Impossible de charger vos missions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserMissions();
  }, []);

  // Fonction pour rafraîchir la liste
  const handleRefresh = () => {
    setRefreshing(true);
    loadUserMissions();
  };

  // Fonction pour formater la date en toute sécurité
  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Date non définie";
    
    try {
      // Gestion des différentes formes possibles de date dans Firestore
      let date;
      if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        // Cas des Timestamp Firestore
        date = dateValue.toDate();
      } else if (dateValue instanceof Date) {
        // Cas des objets Date
        date = dateValue;
      } else {
        // Essayer de convertir depuis une string ou un timestamp
        date = new Date(dateValue);
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      console.warn("Erreur de formatage de date:", error);
      return "Date invalide";
    }
  };

  // Fonction pour afficher un indicateur de statut coloré
  const renderStatusIndicator = (status: string) => {
    let color = '#FFA500'; // Orange pour pending
    if (status === 'completed') color = '#4CAF50'; // Vert pour completed
    if (status === 'failed') color = '#F44336'; // Rouge pour failed

    return (
      <View style={[styles.statusIndicator, { backgroundColor: color }]}>
        <Text style={styles.statusText}>
          {status === 'pending' ? 'En cours' : status === 'completed' ? 'Terminée' : 'Échouée'}
        </Text>
      </View>
    );
  };

  // Rendu d'une mission
  const renderMissionItem = ({ item }: { item: UserMissionWithDetails }) => {
    if (!item.missionDetails) return null;
    
    return (
      <TouchableOpacity 
        style={styles.missionCard}
        onPress={() => {
          // Navigation vers le détail de la mission (à implémenter plus tard)
          // navigation.navigate('MissionDetail', { missionId: item.missionId });
        }}
      >
        <View style={styles.missionHeader}>
          <Text style={styles.missionTitle}>{item.missionDetails.titre || "Sans titre"}</Text>
          {renderStatusIndicator(item.status)}
        </View>
        
        <Text style={styles.missionDescription} numberOfLines={2}>
          {item.missionDetails.description || "Pas de description disponible"}
        </Text>
        
        {/* Date de début si disponible */}
        {item.missionDetails.recurrence && item.missionDetails.recurrence.dateDebut && (
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.dateText}>
              {formatDate(item.missionDetails.recurrence.dateDebut)}
            </Text>
          </View>
        )}
        
        <View style={styles.missionFooter}>
          <View style={styles.pointsContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.pointsText}>{item.missionDetails.points || 0} points</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Progression: {item.progression || 0}%
            </Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${item.progression || 0}%` }
                ]} 
              />
            </View>
          </View>
        </View>
        
        {item.isPartOfCollective && (
          <View style={styles.collectiveTag}>
            <Ionicons name="people" size={14} color="#fff" />
            <Text style={styles.collectiveTagText}>Mission collective</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890ff" />
        <Text style={styles.loadingText}>Chargement de vos missions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={userMissions}
        renderItem={renderMissionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Vous n'avez pas encore de missions</Text>
            <TouchableOpacity 
              style={styles.emptyButton} 
              onPress={() => navigation.navigate('CreateMission')}
            >
              <Text style={styles.emptyButtonText}>Créer une mission</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  missionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  missionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  missionFooter: {
    marginTop: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1890ff',
  },
  collectiveTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1890ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  collectiveTagText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
});

export default UserMissionsPage;
