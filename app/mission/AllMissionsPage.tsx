import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { getAllMissions, assignMissionToUser, deleteMission } from '../firebase/firebaseMission';
import { auth } from '../firebase/firebaseConfig';
import { Mission } from './Interface';
import { Ionicons } from '@expo/vector-icons';
import MissionCard from './components/MissionCard';


const AllMissionsPage = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showDeleteButtons, setShowDeleteButtons] = useState(false);
  const [deletingMissionId, setDeletingMissionId] = useState<string | null>(null);
  const [confirmDeleteMission, setConfirmDeleteMission] = useState<{ id: string, title: string } | null>(null);

  
  
  const currentUser = auth.currentUser;
  
  // Charger toutes les missions
  const loadAllMissions = async () => {
    try {
      const allMissions = await getAllMissions();
      setMissions(allMissions);
      applyFilters(allMissions, searchQuery, selectedType);
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
  
  // Appliquer les filtres (recherche et type)
  const applyFilters = (missionsToFilter: Mission[], query: string, type: string | null) => {
    let filtered = missionsToFilter;
    
    // Appliquer la recherche par texte
    if (query) {
      filtered = filtered.filter(mission => 
        mission.titre.toLowerCase().includes(query.toLowerCase()) ||
        mission.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Appliquer le filtre par type
    if (type) {
      filtered = filtered.filter(mission => mission.recurrence.frequence === type);
    }
    
    setFilteredMissions(filtered);
  };
  
  // Gestionnaire de recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(missions, query, selectedType);
  };
  
  // Gestionnaire de filtre par type
  const handleTypeFilter = (type: string | null) => {
    setSelectedType(type === selectedType ? null : type);
    applyFilters(missions, searchQuery, type === selectedType ? null : type);
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
    const missionTitle = mission ? mission.titre : 'cette mission';
    
    console.log('[DEBUG] Mission trouvée:', mission);
    console.log('[DEBUG] Titre de la mission:', missionTitle);
    
    // Ouvrir la confirmation personnalisée
    setConfirmDeleteMission({ id: missionId, title: missionTitle });
  };

  // Confirmer la suppression
  const confirmDeletion = async () => {
    if (!confirmDeleteMission) return;
    
    const { id: missionId, title: missionTitle } = confirmDeleteMission;
    
    console.log('[DEBUG] 🗑️ Suppression confirmée pour mission:', missionId);
    
    try {
      console.log('[DEBUG] 📋 Réglage de deletingMissionId...');
      setDeletingMissionId(missionId);
      console.log('[DEBUG] ✅ deletingMissionId réglé à:', missionId);
      
      console.log('[DEBUG] 📞 Appel de deleteMission avec ID:', missionId);
      const result = await deleteMission(missionId);
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
  
  // Rendu des filtres de type
  const renderTypeFilters = () => {
    const types = [
      { label: 'Quotidienne', value: 'daily' },
      { label: 'Hebdomadaire', value: 'weekly' },
      { label: 'Mensuelle', value: 'monthly' }
    ];
    
    return (
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filtrer par type :</Text>
        <View style={styles.filterButtons}>
          {types.map(type => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.filterButton,
                selectedType === type.value && styles.filterButtonSelected
              ]}
              onPress={() => handleTypeFilter(type.value)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedType === type.value && styles.filterButtonTextSelected
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
            {searchQuery || selectedType ? ` (sur ${missions.length})` : ''}
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

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une mission..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      
      {/* Filtres */}
      {renderTypeFilters()}
      
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

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={confirmDeleteMission !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDeletion}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={30} color="#ff4d4f" />
              <Text style={styles.modalTitle}>🗑️ Supprimer la mission</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Voulez-vous vraiment supprimer la mission "{confirmDeleteMission?.title}" ?
            </Text>
            
            <Text style={styles.modalWarning}>
              ⚠️ ATTENTION : Cette action est définitive et supprimera :
            </Text>
            
            <View style={styles.warningList}>
              <Text style={styles.warningItem}>• 📋 La mission principale</Text>
              <Text style={styles.warningItem}>• 👥 Toutes les assignations utilisateurs</Text>
              <Text style={styles.warningItem}>• 🎯 Toutes les missions collectives associées</Text>
              <Text style={styles.warningItem}>• 📊 L'historique de progression</Text>
              <Text style={styles.warningItem}>• 🏆 Les points associés</Text>
            </View>
            
            <Text style={styles.modalFinalWarning}>
              ❌ Cette action ne peut PAS être annulée !
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelDeletion}
              >
                <Text style={styles.cancelButtonText}>❌ Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDeletion}
                disabled={deletingMissionId === confirmDeleteMission?.id}
              >
                {deletingMissionId === confirmDeleteMission?.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteButtonText}>🗑️ Supprimer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterButtonSelected: {
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextSelected: {
    color: '#fff',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 22,
  },
  modalWarning: {
    fontSize: 14,
    color: '#ff4d4f',
    fontWeight: '600',
    marginBottom: 12,
  },
  warningList: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  warningItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  modalFinalWarning: {
    fontSize: 14,
    color: '#ff4d4f',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    padding: 8,
    backgroundColor: '#fff2f0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffccc7',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default AllMissionsPage;
