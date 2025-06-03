import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { getAuth } from 'firebase/auth';
import { updateMissionsProgressFromDishes, getUserMissions, getMission } from '../firebase/firebaseMission';
import { Ionicons } from '@expo/vector-icons';

const MissionProgressTester = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Test avec un plat fictif
  const testMissionUpdate = async () => {
    if (!currentUser) {
      Alert.alert('Erreur', 'Vous devez être connecté pour tester');
      return;
    }

    setIsLoading(true);
    addTestResult('🧪 Début du test de mise à jour des missions');

    try {
      // Créer un plat fictif pour le test
      const testDishes = [
        {
          plat: {
            id: 'test-plat-id', // ID de test
            name: 'Plat de Test',
            price: 15.00
          },
          quantite: 1
        }
      ];

      addTestResult(`📝 Test avec plat: ${testDishes[0].plat.name} (ID: ${testDishes[0].plat.id})`);

      const result = await updateMissionsProgressFromDishes(currentUser.uid, testDishes);
      
      addTestResult(`✅ Test terminé - ${result.updatedMissions} missions mises à jour`);
      addTestResult(`📊 Résultat: ${result.message}`);

      Alert.alert(
        'Test terminé',
        `${result.updatedMissions} mission(s) mise(s) à jour\n${result.message}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      addTestResult(`❌ Erreur durant le test: ${error}`);
      Alert.alert('Erreur', `Test échoué: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher les missions de l'utilisateur
  const showUserMissions = async () => {
    if (!currentUser) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    setIsLoading(true);
    addTestResult('📋 Récupération des missions utilisateur');

    try {
      const userMissions = await getUserMissions(currentUser.uid);
      addTestResult(`📊 ${userMissions.length} missions trouvées`);

      for (const userMission of userMissions) {
        try {
          const mission = await getMission(userMission.missionId);
          if (mission) {
            const platInfo = mission.plat ? ` - Plat: ${mission.plat.name} (ID: ${mission.plat.id})` : ' - Aucun plat associé';
            addTestResult(`🎯 "${mission.titre}" (${userMission.status})${platInfo}`);
          }
        } catch (error) {
          addTestResult(`⚠️ Erreur pour mission ${userMission.missionId}: ${error}`);
        }
      }

    } catch (error) {
      addTestResult(`❌ Erreur: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Testeur de Missions</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={testMissionUpdate}
          disabled={isLoading}
        >
          <Ionicons name="play-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>Tester Mise à Jour</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={showUserMissions}
          disabled={isLoading}
        >
          <Ionicons name="list" size={20} color="#083F8C" />
          <Text style={[styles.buttonText, { color: '#083F8C' }]}>Voir Mes Missions</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Ionicons name="trash" size={20} color="#F44336" />
          <Text style={[styles.buttonText, { color: '#F44336' }]}>Effacer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>📝 Résultats des Tests</Text>
        <ScrollView style={styles.resultsScroll}>
          {testResults.length === 0 ? (
            <Text style={styles.noResults}>Aucun test effectué</Text>
          ) : (
            testResults.map((result, index) => (
              <Text key={index} style={styles.resultItem}>
                {result}
              </Text>
            ))
          )}
        </ScrollView>
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
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#083F8C',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#083F8C',
  },
  clearButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultsScroll: {
    flex: 1,
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 20,
  },
  resultItem: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    lineHeight: 20,
  },
});

export default MissionProgressTester;
