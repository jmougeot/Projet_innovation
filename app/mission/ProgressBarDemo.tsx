import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { updateUserMissionProgress } from '../firebase/firebaseMission';

// Composant de démonstration pour tester la nouvelle barre de progression
const ProgressBarDemo = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Exemple de mise à jour de progression avec valeur absolue
  const handleUpdateProgress = async (userMissionId: string, newValue: number) => {
    setIsUpdating(true);
    try {
      const result = await updateUserMissionProgress(userMissionId, newValue);
      Alert.alert(
        'Progression mise à jour',
        `Valeur actuelle: ${result.currentValue}\nProgression: ${result.progressPercentage}%\nTerminée: ${result.isCompleted ? 'Oui' : 'Non'}`
      );
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la progression');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Démonstration de la barre de progression</Text>
      
      <Text style={styles.description}>
        La nouvelle barre de progression affiche maintenant:
      </Text>
      
      <View style={styles.featureList}>
        <Text style={styles.feature}>• Format "X/Y (Z%)" pour les missions avec targetValue</Text>
        <Text style={styles.feature}>• Format "Z%" pour les missions sans targetValue</Text>
        <Text style={styles.feature}>• Calcul automatique du pourcentage</Text>
        <Text style={styles.feature}>• Mise à jour automatique du statut à 100%</Text>
      </View>

      <Text style={styles.subtitle}>Exemple d'utilisation:</Text>
      
      <TouchableOpacity 
        style={[styles.button, isUpdating && styles.buttonDisabled]}
        onPress={() => handleUpdateProgress('exemple-mission-id', 5)}
        disabled={isUpdating}
      >
        <Text style={styles.buttonText}>
          {isUpdating ? 'Mise à jour...' : 'Définir progression à 5/10'}
        </Text>
      </TouchableOpacity>

      <View style={styles.exampleProgressBar}>
        <Text style={styles.exampleLabel}>Exemple d'affichage:</Text>
        <View style={styles.progressExample}>
          <Text style={styles.progressText}>Progression</Text>
          <Text style={styles.progressValue}>5/10 (50%)</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: '50%' }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#194A8D',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  featureList: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  feature: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#194A8D',
  },
  button: {
    backgroundColor: '#194A8D',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#bbb',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exampleProgressBar: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  exampleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  progressExample: {
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
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
});

export default ProgressBarDemo;
