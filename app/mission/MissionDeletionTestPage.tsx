import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { getAllMissions, deleteMission } from '../firebase/firebaseMission';
import { Mission } from './Interface';
import { Ionicons } from '@expo/vector-icons';

const MissionDeletionTestPage = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingMissionId, setDeletingMissionId] = useState<string | null>(null);

  // Charger toutes les missions
  const loadMissions = async () => {
    try {
      setLoading(true);
      const allMissions = await getAllMissions();
      setMissions(allMissions);
      console.log(`[TEST] ${allMissions.length} missions chargées`);
    } catch (error) {
      console.error('[TEST] Erreur lors du chargement des missions:', error);
      Alert.alert('Erreur', 'Impossible de charger les missions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, []);

  // Tester la suppression d'une mission
  const testDeleteMission = async (mission: Mission) => {
    Alert.alert(
      '🧪 Test de suppression',
      `Tester la suppression de "${mission.titre}" ?\n\n⚠️ ATTENTION: Cette action supprimera définitivement la mission et toutes ses données associées.`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Tester la suppression',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingMissionId(mission.id);
              console.log(`[TEST] 🧪 Test de suppression de la mission: ${mission.id}`);
              
              const result = await deleteMission(mission.id);
              
              console.log(`[TEST] ✅ Résultat de la suppression:`, result);
              
              Alert.alert(
                '✅ Test réussi', 
                `Mission "${mission.titre}" supprimée avec succès!\n\n` +
                `• Assignations supprimées: ${result.deletedUserMissions || 0}\n` +
                `• Missions collectives supprimées: ${result.deletedCollectiveMissions || 0}`,
                [{ text: 'OK' }]
              );
              
              // Recharger la liste
              await loadMissions();
            } catch (error) {
              console.error('[TEST] ❌ Erreur lors du test de suppression:', error);
              Alert.alert(
                '❌ Test échoué', 
                `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
                [{ text: 'OK' }]
              );
            } finally {
              setDeletingMissionId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4d4f" />
        <Text style={styles.loadingText}>Chargement des missions pour test...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🧪 Test de suppression de missions</Text>
      </View>

      <View style={styles.warningCard}>
        <Ionicons name="warning" size={24} color="#ff4d4f" />
        <View style={styles.warningContent}>
          <Text style={styles.warningTitle}>⚠️ PAGE DE TEST</Text>
          <Text style={styles.warningText}>
            Cette page permet de tester la fonction de suppression des missions. 
            Les suppressions sont définitives et incluent toutes les données associées.
          </Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📊 Statistiques</Text>
        <Text style={styles.statsText}>Missions trouvées: {missions.length}</Text>
      </View>

      <Text style={styles.sectionTitle}>Missions disponibles pour test:</Text>

      {missions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-circle-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Aucune mission trouvée</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/mission/CreateMissionPage' as any)}
          >
            <Text style={styles.createButtonText}>Créer une mission pour tester</Text>
          </TouchableOpacity>
        </View>
      ) : (
        missions.map((mission) => (
          <View key={mission.id} style={styles.missionCard}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionTitle}>{mission.titre}</Text>
              <View style={styles.missionMeta}>
                <Text style={styles.missionPoints}>{mission.points} pts</Text>
              </View>
            </View>
            
            <Text style={styles.missionDescription} numberOfLines={2}>
              {mission.description}
            </Text>
            
            <View style={styles.missionDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="repeat-outline" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {mission.recurrence?.frequence === 'daily' ? 'Quotidienne' :
                   mission.recurrence?.frequence === 'weekly' ? 'Hebdomadaire' :
                   mission.recurrence?.frequence === 'monthly' ? 'Mensuelle' : 'Inconnue'}
                </Text>
              </View>
              
              {mission.plat && (
                <View style={styles.detailItem}>
                  <Ionicons name="restaurant-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>Plat associé</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.deleteButton, deletingMissionId === mission.id && styles.deleteButtonLoading]}
              onPress={() => testDeleteMission(mission)}
              disabled={deletingMissionId === mission.id}
            >
              {deletingMissionId === mission.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#fff" />
              )}
              <Text style={styles.deleteButtonText}>
                {deletingMissionId === mission.id ? 'Suppression...' : 'Tester suppression'}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4d4f',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fff2f0',
    borderColor: '#ffccc7',
    borderWidth: 1,
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4d4f',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#ff4d4f',
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
    color: '#333',
  },
  missionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  missionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  missionMeta: {
    alignItems: 'flex-end',
  },
  missionPoints: {
    fontSize: 14,
    color: '#1890ff',
    fontWeight: '600',
  },
  missionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  missionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4d4f',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  deleteButtonLoading: {
    backgroundColor: '#ff7875',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MissionDeletionTestPage;
