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
import { router } from 'expo-router';
import { getAllMissions, assignMissionToUser, deleteMission } from '../../firebase/firebaseMissionOptimized';
import { auth } from '../../firebase/firebaseConfig';
import { Mission } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { MissionCard, MissionSearch, MissionFilters, ConfirmDeleteModal } from '../components';
import { commonStyles } from '../styles';
import { filterMissions, sortMissions } from '../utils';


const AllMissionsPage = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecurrence, setSelectedRecurrence] = useState('');
  const [showDeleteButtons, setShowDeleteButtons] = useState(false);
  const [deletingMissionId, setDeletingMissionId] = useState<string | null>(null);
  const [confirmDeleteMission, setConfirmDeleteMission] = useState<Mission | null>(null);

  
  
  const currentUser = auth.currentUser;
  
  // Charger toutes les missions
  const loadAllMissions = async () => {
    try {
      const allMissions = await getAllMissions();
      setMissions(allMissions);
      applyFilters(allMissions);
    } catch (error) {
      console.error('Erreur lors de la récupération des missions:', error);
      Alert.alert('Erreur', 'Impossible de charger les missions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadAllMissions();
  }, []);
  
  // Appliquer les filtres
  const applyFilters = (missionsToFilter: Mission[] = missions) => {
    const filtered = filterMissions(missionsToFilter, {
      searchQuery,
      recurrence: selectedRecurrence as 'daily' | 'weekly' | 'monthly' | undefined,
    });
    
    // Trier par titre par défaut
    const sorted = sortMissions(filtered, 'titre', 'asc');
    setFilteredMissions(sorted);
  };

  // Effet pour appliquer les filtres quand ils changent
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedRecurrence, missions]);
  
  // Gestionnaires de filtres
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleRecurrenceChange = (recurrence: string) => {
    setSelectedRecurrence(recurrence);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedRecurrence('');
  };
  
  // Rafraîchissement de la liste
  const handleRefresh = () => {
    setRefreshing(true);
    loadAllMissions();
  };
  
  // Supprimer une mission - nouvelle version avec confirmation personnalisée
  const handleDeleteMission = async (missionId: string) => {
    console.log('[DEBUG] handleDeleteMission appelée avec ID:', missionId);
    
    // Trouver les détails de la mission pour afficher son titre
    const mission = missions.find(m => m.id === missionId);
    
    console.log('[DEBUG] Mission trouvée:', mission);
    
    if (mission) {
      // Ouvrir la confirmation personnalisée
      setConfirmDeleteMission(mission);
    }
  };

  // Confirmer la suppression
  const confirmDeletion = async () => {
    if (!confirmDeleteMission) return;
    
    console.log('[DEBUG] 🗑️ Suppression confirmée pour mission:', confirmDeleteMission.id);
    
    try {
      console.log('[DEBUG] 📋 Réglage de deletingMissionId...');
      setDeletingMissionId(confirmDeleteMission.id);
      console.log('[DEBUG] ✅ deletingMissionId réglé à:', confirmDeleteMission.id);
      
      console.log('[DEBUG] 📞 Appel de deleteMission avec ID:', confirmDeleteMission.id);
      const result = await deleteMission(confirmDeleteMission.id);
      console.log('[DEBUG] ✅ deleteMission terminé avec succès. Résultat:', result);
      
      console.log('[DEBUG] 📢 Mission supprimée avec succès !');
      
      console.log('[DEBUG] 🔄 Rechargement des missions...');
      await loadAllMissions();
      console.log('[DEBUG] ✅ Missions rechargées avec succès');
      
      // Fermer la boîte de confirmation
      setConfirmDeleteMission(null);
      
    } catch (error) {
      console.error('[DEBUG] ❌ ERREUR lors de la suppression:', error);
      console.error('[DEBUG] ❌ Type d\'erreur:', typeof error);
      console.error('[DEBUG] ❌ Message d\'erreur:', error instanceof Error ? error.message : 'Message indisponible');
      console.error('[DEBUG] ❌ Stack trace:', error instanceof Error ? error.stack : 'Stack indisponible');
    } finally {
      console.log('[DEBUG] 🧹 Nettoyage - réinitialisation deletingMissionId');
      setDeletingMissionId(null);
      console.log('[DEBUG] 🏁 Fin de la suppression');
    }
  };

  // Annuler la suppression
  const cancelDeletion = () => {
    console.log('[DEBUG] ❌ Suppression annulée');
    setConfirmDeleteMission(null);
  };

  // Basculer l'affichage des boutons de suppression
  const toggleDeleteMode = () => {
    console.log('[DEBUG] toggleDeleteMode appelée. showDeleteButtons avant:', showDeleteButtons);
    setShowDeleteButtons(!showDeleteButtons);
    console.log('[DEBUG] showDeleteButtons après:', !showDeleteButtons);
  };

  // S'inscrire à une mission
  const handleAssignMission = async (missionId: string) => {
    if (!currentUser) {
      Alert.alert('Erreur', 'Vous devez être connecté pour vous inscrire à une mission');
      return;
    }
    
    try {
      await assignMissionToUser(missionId, currentUser.uid);
      Alert.alert('Succès', 'Vous êtes maintenant inscrit à cette mission');
      
      // Rediriger vers la page des missions de l'utilisateur
      router.push('/mission/UserMissionsPage' as any);
    } catch (error) {
      console.error('Erreur lors de l\'inscription à la mission:', error);
      Alert.alert('Erreur', 'Impossible de vous inscrire à cette mission');
    }
  };
  
  // Fonction utilitaire pour formater la date en toute sécurité (gardée pour compatibilité si nécessaire)
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
  
  // Rendu d'un élément mission avec le nouveau composant
  const renderMissionItem = ({ item }: { item: Mission }) => {
    return (
      <MissionCard
        mission={item}
        showDeleteButtons={showDeleteButtons}
        deletingMissionId={deletingMissionId}
        onAssignMission={handleAssignMission}
        onDeleteMission={handleDeleteMission}
      />
    );
  };
  
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890ff" />
        <Text style={styles.loadingText}>Chargement des missions...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* En-tête avec contrôles */}
      <View style={styles.headerControls}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Toutes les missions</Text>
          <Text style={styles.missionCount}>
            {filteredMissions.length} mission{filteredMissions.length > 1 ? 's' : ''}
            {searchQuery || selectedRecurrence ? ` (sur ${missions.length})` : ''}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.controlButton, showDeleteButtons && styles.controlButtonActive]}
            onPress={() => {
              console.log('[DEBUG] Bouton Modifier/Annuler cliqué');
              toggleDeleteMode();
            }}
          >
            <Ionicons 
              name={showDeleteButtons ? "trash" : "settings-outline"} 
              size={20} 
              color={showDeleteButtons ? "#fff" : "#666"} 
            />
            <Text style={[styles.controlButtonText, showDeleteButtons && styles.controlButtonTextActive]}>
              {showDeleteButtons ? "Annuler" : "Modifier"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => router.push('/mission/CreateMissionPage' as any)}
          >
            <Ionicons name="add-outline" size={20} color="#666" />
            <Text style={styles.controlButtonText}>Créer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Avertissement en mode suppression */}
      {showDeleteButtons && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={20} color="#ff4d4f" />
          <Text style={styles.warningText}>
            ⚠️ Mode modification activé - Vous pouvez maintenant supprimer des missions en cliquant sur les boutons rouges.
          </Text>
        </View>
      )}

      {/* Composants de recherche et filtres */}
      <MissionSearch
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />
      
      <MissionFilters
        selectedRecurrence={selectedRecurrence}
        onRecurrenceChange={handleRecurrenceChange}
        onClearFilters={handleClearFilters}
      />
      
      {/* Liste des missions */}
      <FlatList
        data={filteredMissions}
        renderItem={renderMissionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-circle-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>
              {missions.length === 0 
                ? "Aucune mission disponible pour le moment" 
                : "Aucune mission ne correspond à votre recherche"}
            </Text>
            {currentUser?.uid && missions.length === 0 && (
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => router.push('/mission/CreateMissionPage' as any)}
              >
                <Text style={styles.emptyButtonText}>Créer une mission</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Modal de confirmation de suppression avec nouveau composant */}
      <ConfirmDeleteModal
        visible={confirmDeleteMission !== null}
        mission={confirmDeleteMission}
        isDeleting={deletingMissionId === confirmDeleteMission?.id}
        onConfirm={confirmDeletion}
        onCancel={cancelDeletion}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  missionCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 4,
  },
  controlButtonActive: {
    backgroundColor: '#ff4d4f',
    borderColor: '#ff4d4f',
  },
  controlButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  controlButtonTextActive: {
    color: '#fff',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f0',
    borderColor: '#ffccc7',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 6,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#ff4d4f',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
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
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
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
});

export default AllMissionsPage;
