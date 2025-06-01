import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { getUserMissions, getMission, updateUserMissionProgress } from '../../firebase/firebaseMission';
import { auth } from '../../firebase/firebaseConfig';
import { Mission } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';

// Interface pour les missions de l'utilisateur avec données étendues
interface UserMissionWithDetails {
  id: string;
  userId: string;
  missionId: string;
  status: "pending" | "completed" | "failed";
  progression: number;
  currentValue?: number; // Valeur actuelle pour les missions avec targetValue
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
  const [activeMissions, setActiveMissions] = useState<UserMissionWithDetails[]>([]);
  const [completedMissions, setCompletedMissions] = useState<UserMissionWithDetails[]>([]);
  
  const currentUser = auth.currentUser;

  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../../assets/fonts/AlexBrush-Regular.ttf'),
  });

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
      
      // Séparer les missions actives et complétées
      const active = missionsWithDetails.filter(m => m.status === 'pending');
      const completed = missionsWithDetails.filter(m => m.status === 'completed');
      
      setActiveMissions(active);
      setCompletedMissions(completed);
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

  // Fonction pour déterminer la couleur de la barre de progression en fonction du pourcentage
  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return '#F44336'; // Rouge pour progression faible
    if (percentage < 70) return '#FFA726'; // Orange pour progression moyenne
    return '#4CAF50'; // Vert pour bonne progression
  };

  // Rendu d'une mission active
  const renderActiveMissionItem = (item: UserMissionWithDetails) => {
    if (!item.missionDetails) return null;
    
    const progressPercentage = item.progression || 0;
    const progressColor = getProgressColor(progressPercentage);
    
    // Calculer les valeurs pour l'affichage
    const targetValue = item.missionDetails.targetValue || 100;
    const currentValue = item.currentValue !== undefined 
      ? item.currentValue 
      : Math.round((progressPercentage / 100) * targetValue);
    
    // Déterminer le format d'affichage
    const showAbsoluteValues = item.missionDetails.targetValue !== undefined;
    
    return (
      <TouchableOpacity 
        style={styles.missionCard}
        onPress={() => {
          // Navigation vers le détail de la mission (à implémenter plus tard)
        }}
      >
        <View style={styles.missionHeader}>
          <Text style={styles.missionTitle}>{item.missionDetails.titre || "Sans titre"}</Text>
          <View style={[styles.statusIndicator, { backgroundColor: '#FFA500' }]}>
            <Text style={styles.statusText}>En cours</Text>
          </View>
        </View>
        
        <Text style={styles.missionDescription} numberOfLines={2}>
          {item.missionDetails.description || "Pas de description disponible"}
        </Text>
        
        {/* Points de la mission */}
        <View style={styles.pointsContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.pointsText}>{item.missionDetails.points || 0} points</Text>
        </View>
        
        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelContainer}>
            <Text style={styles.progressText}>Progression</Text>
            <Text style={[styles.progressPercentage, { color: progressColor }]}>
              {showAbsoluteValues 
                ? `${currentValue}/${targetValue} (${progressPercentage}%)`
                : `${progressPercentage}%`
              }
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${progressPercentage}%`, backgroundColor: progressColor }
              ]} 
            />
            {/* Marqueurs de jalons */}
            <View style={[styles.milestone, { left: '25%' }]} />
            <View style={[styles.milestone, { left: '50%' }]} />
            <View style={[styles.milestone, { left: '75%' }]} />
          </View>
        </View>
        
        {/* Tag mission collective */}
        {item.isPartOfCollective && (
          <View style={styles.collectiveTag}>
            <Ionicons name="people" size={14} color="#fff" />
            <Text style={styles.collectiveTagText}>Mission collective</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Rendu d'une mission complétée (version simplifiée)
  const renderCompletedMissionItem = (item: UserMissionWithDetails) => {
    if (!item.missionDetails) return null;
    
    return (
      <TouchableOpacity 
        style={styles.completedMissionCard}
        onPress={() => {
          // Navigation vers le détail de la mission (à implémenter plus tard)
        }}
      >
        <View style={styles.missionHeader}>
          <Text style={styles.completedMissionTitle}>{item.missionDetails.titre || "Sans titre"}</Text>
          <View style={[styles.statusIndicator, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.statusText}>Terminée</Text>
          </View>
        </View>
        
        <View style={styles.completedMissionFooter}>
          <View style={styles.pointsContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.pointsText}>{item.missionDetails.points || 0} points</Text>
          </View>
          
          {item.dateCompletion && (
            <View style={styles.dateContainer}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
              <Text style={styles.dateText}>
                Complétée le {formatDate(item.dateCompletion)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CAE1EF" />
        <Text style={styles.loadingText}>Chargement de vos missions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerSquare}>
        <Text style={styles.headerSquareText}>Mes Missions</Text>
      </View>
      
      {/* Section missions actives */}
      <View style={styles.sectionMissionsActives}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Missions en cours</Text>
          <LinearGradient
            colors={['transparent', '#CAE1EF', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.sectionSeparator}
          />
        </View>
        
        <ScrollView style={styles.scrollView}>
          {activeMissions.length > 0 ? (
            activeMissions.map((mission) => (
              <View key={mission.id}>
                {renderActiveMissionItem(mission)}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune mission en cours</Text>
              <TouchableOpacity 
                style={styles.emptyButton} 
                onPress={() => router.push('/mission/AllMissionsPage' as any )}
              >
                <Text style={styles.emptyButtonText}>Découvrir des missions</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
      
      {/* Section missions complétées 
      <View style={styles.sectionMissionsCompletees}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Missions complétées</Text>
          <LinearGradient
            colors={['transparent', '#CAE1EF', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.sectionSeparator}
          />
        </View>
        
        <ScrollView style={styles.scrollView}>
          {completedMissions.length > 0 ? (
            completedMissions.map((mission) => (
              <View key={mission.id}>
                {renderCompletedMissionItem(mission)}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune mission complétée</Text>
            </View>
          )}
        </ScrollView>
      </View>*/}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#194A8D',
  },
  headerSquare: {
    alignSelf: 'center',
    backgroundColor: '#CAE1EF',
    width: 150,
    height: 35,
    marginBottom: 10,
    borderRadius: 80,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        marginTop: 45,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerSquareText: {
    color: '#083F8C',
    fontWeight: 'bold',
    fontSize: 18,
  },
  sectionMissionsActives: {
    flex: 1,
    marginBottom: 10,
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    overflow: 'hidden'
  },
  sectionMissionsCompletees: {
    flex: 0.4,
    marginBottom: 10,
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    overflow: 'hidden'
  },
  sectionHeader: {
    padding: 10,
    backgroundColor: '#194A8D',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontStyle: 'italic',
    color: 'white',
    textAlign: 'center',
    paddingBottom: 5,
    letterSpacing: 1,
    fontFamily: 'AlexBrush',
  },
  sectionSeparator: {
    height: 4,
    width: '100%',
    marginTop: 5,
  },
  scrollView: {
    padding: 10,
    backgroundColor: '#F3EFEF',
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
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  completedMissionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    opacity: 0.85,
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
    color: '#194A8D',
  },
  completedMissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
    color: '#194A8D',
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
    marginTop: 10,
    marginBottom: 4,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
  },
  milestone: {
    position: 'absolute',
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    top: '20%',
    zIndex: 2,
  },
  collectiveTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#CAE1EF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  collectiveTagText: {
    color: '#194A8D',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#194A8D',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#CAE1EF',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#194A8D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  completedMissionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default UserMissionsPage;
