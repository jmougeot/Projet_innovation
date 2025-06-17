import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mission } from '../types';

interface MissionCardProps {
  mission: Mission;
  showDeleteButtons: boolean;
  deletingMissionId: string | null;
  onAssignMission: (missionId: string) => void;
  onDeleteMission: (missionId: string) => void;
}

const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  showDeleteButtons,
  deletingMissionId,
  onAssignMission,
  onDeleteMission,
}) => {
  // Vérifier si l'objet mission est complet
  if (!mission || !mission.titre) {
    return null; // Ne pas rendre les missions incomplètes
  }

  // Log au début pour diagnostiquer les props
  console.log(`[DEBUG] MissionCard rendu - Mission: ${mission.id}, showDeleteButtons: ${showDeleteButtons}`);

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

  // Fonction pour formater la fréquence
  const formatFrequency = (frequence: string) => {
    switch (frequence) {
      case 'daily':
        return 'Tous les jours';
      case 'weekly':
        return 'Toutes les semaines';
      case 'monthly':
        return 'Tous les mois';
      default:
        return 'Fréquence non définie';
    }
  };

  console.log('[DEBUG] Rendu mission:', mission.id, 'showDeleteButtons:', showDeleteButtons);
  console.log('[DEBUG] Mission props reçues:', { 
    missionId: mission.id, 
    showDeleteButtons, 
    deletingMissionId, 
    hasOnDeleteMission: typeof onDeleteMission === 'function' 
  });

  return (
    <View style={styles.missionCard}>
      <View style={styles.missionHeader}>
        <Text style={styles.missionTitle}>{mission.titre}</Text>
        {/* Bouton de suppression uniquement en mode suppression */}
        {showDeleteButtons && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => {
              console.log('[DEBUG] Bouton delete header cliqué pour mission:', mission.id);
              onDeleteMission(mission.id);
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.missionDescription} numberOfLines={3}>
        {mission.description || "Pas de description disponible"}
      </Text>
      
      <View style={styles.missionDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {mission.recurrence && mission.recurrence.dateDebut 
              ? formatDate(mission.recurrence.dateDebut)
              : "Date non définie"}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="repeat-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {mission.recurrence && mission.recurrence.frequence 
              ? formatFrequency(mission.recurrence.frequence)
              : 'Fréquence non définie'}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.detailText}>{mission.points || 0} points</Text>
        </View>
      </View>
      
      <View style={styles.missionActions}>
        <TouchableOpacity 
          style={[styles.assignButton, !showDeleteButtons && styles.assignButtonFull]}
          onPress={() => onAssignMission(mission.id)}
        >
          <Text style={styles.assignButtonText}>S&apos;inscrire</Text>
        </TouchableOpacity>
        
        {showDeleteButtons && (
          <TouchableOpacity 
            style={[
              styles.deleteActionButton, 
              deletingMissionId === mission.id && styles.deleteActionButtonLoading
            ]}
            onPress={() => {
              console.log('[DEBUG] Bouton delete action cliqué pour mission:', mission.id);
              console.log('[DEBUG] Appelant onDeleteMission avec ID:', mission.id);
              onDeleteMission(mission.id);
            }}
            disabled={deletingMissionId === mission.id}
          >
            {deletingMissionId === mission.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="trash-outline" size={16} color="#fff" />
            )}
            <Text style={styles.deleteActionButtonText}>
              {deletingMissionId === mission.id ? 'Suppression...' : 'Supprimer'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  missionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
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
  deleteActionButtonLoading: {
    backgroundColor: '#ff7875',
  },
  deleteActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MissionCard;
