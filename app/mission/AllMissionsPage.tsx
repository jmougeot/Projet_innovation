import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import { getAllMissions, assignMissionToUser, deleteMission } from '../firebase/firebaseMission';
import { getAuth } from 'firebase/auth';
import { Mission } from './Interface';
import { Ionicons } from '@expo/vector-icons';


const AllMissionsPage = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showDeleteButtons, setShowDeleteButtons] = useState(false);

  
  
  const auth = getAuth();
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
  
  // Supprimer une mission
  const handleDeleteMission = async (missionId: string) => {
    // Trouver les détails de la mission pour afficher son titre
    const mission = missions.find(m => m.id === missionId);
    const missionTitle = mission ? mission.titre : 'cette mission';
    
    Alert.alert(
      '🗑️ Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer "${missionTitle}" ?\n\n⚠️ Cette action est irréversible et supprimera :\n• La mission principale\n• Toutes les assignations utilisateurs\n• Toutes les missions collectives associées\n• L'historique de progression\n\nCette action ne peut pas être annulée.`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[MISSIONS] 🗑️ Début de suppression de la mission:', missionId);
              await deleteMission(missionId);
              console.log('[MISSIONS] ✅ Mission supprimée avec succès');
              Alert.alert(
                '✅ Succès', 
                `La mission "${missionTitle}" a été supprimée avec succès.`,
                [{ text: 'OK' }]
              );
              // Recharger la liste des missions
              await loadAllMissions();
            } catch (error) {
              console.error('[MISSIONS] ❌ Erreur lors de la suppression de la mission:', error);
              Alert.alert(
                '❌ Erreur', 
                'Impossible de supprimer la mission. Veuillez vérifier votre connexion et réessayer.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  // Basculer l'affichage des boutons de suppression
  const toggleDeleteMode = () => {
    setShowDeleteButtons(!showDeleteButtons);
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
  
  // Fonction utilitaire pour formater la date en toute sécurité
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
  
  // Rendu d'un élément mission
  const renderMissionItem = ({ item }: { item: Mission }) => {
    // Vérifier si l'objet mission est complet
    if (!item || !item.titre) {
      return null; // Ne pas rendre les missions incomplètes
    }
    
    return (
      <View style={styles.missionCard}>
        <View style={styles.missionHeader}>
          <Text style={styles.missionTitle}>{item.titre}</Text>
          {/* Bouton de suppression uniquement en mode suppression */}
          {showDeleteButtons && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteMission(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.missionDescription} numberOfLines={3}>
          {item.description || "Pas de description disponible"}
        </Text>
        
        <View style={styles.missionDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.recurrence && item.recurrence.dateDebut 
                ? formatDate(item.recurrence.dateDebut)
                : "Date non définie"}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="repeat-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {(item.recurrence && item.recurrence.frequence === 'daily') ? 'Tous les jours' : 
               (item.recurrence && item.recurrence.frequence === 'weekly') ? 'Toutes les semaines' : 
               (item.recurrence && item.recurrence.frequence === 'monthly') ? 'Tous les mois' : 
               'Fréquence non définie'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.detailText}>{item.points || 0} points</Text>
          </View>
        </View>
        
        <View style={styles.missionActions}>
          <TouchableOpacity 
            style={[styles.assignButton, !showDeleteButtons && styles.assignButtonFull]}
            onPress={() => handleAssignMission(item.id)}
          >
            <Text style={styles.assignButtonText}>S'inscrire</Text>
          </TouchableOpacity>
          
          {showDeleteButtons && (
            <TouchableOpacity 
              style={styles.deleteActionButton}
              onPress={() => handleDeleteMission(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.deleteActionButtonText}>Supprimer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
        <Text style={styles.headerTitle}>Toutes les missions</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.controlButton, showDeleteButtons && styles.controlButtonActive]}
            onPress={toggleDeleteMode}
          >
            <Ionicons 
              name={showDeleteButtons ? "trash" : "trash-outline"} 
              size={20} 
              color={showDeleteButtons ? "#fff" : "#666"} 
            />
            <Text style={[styles.controlButtonText, showDeleteButtons && styles.controlButtonTextActive]}>
              {showDeleteButtons ? "Désactiver" : "Gérer"}
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
            Mode suppression activé. Appuyez sur les boutons rouges pour supprimer des missions.
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 4,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e6f7ff',
  },
  typeText: {
    fontSize: 12,
    color: '#1890ff',
    fontWeight: '500',
  },
  missionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  missionDetails: {
    marginVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  missionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  assignButton: {
    flex: 1,
    backgroundColor: '#1890ff',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  assignButtonFull: {
    flex: 2,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteActionButton: {
    flex: 1,
    backgroundColor: '#ff4d4f',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  deleteActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
