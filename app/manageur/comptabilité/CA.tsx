import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { db } from '@/app/firebase/firebaseConfig';
import { collection, doc, getDoc, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import Header from '@/app/components/Header';

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  chiffreAffaire: number;
  poste: string;
}

interface RestaurantFinances {
  caTotal: number;
  lastUpdated: string;
}

const CAManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [restaurantCA, setRestaurantCA] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'ca'>('name');

  // Charger les données lors du montage du composant
  useEffect(() => {
    fetchData();
  }, []);

  // Récupérer les données du restaurant et des employés
  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer le CA total du restaurant
      const restaurantRef = doc(db, 'restaurant', 'finances');
      const restaurantDoc = await getDoc(restaurantRef);
      
      if (restaurantDoc.exists()) {
        const restaurantData = restaurantDoc.data() as RestaurantFinances;
        setRestaurantCA(restaurantData.caTotal);
      } else {
        // Créer un document par défaut si inexistant
        await setDoc(restaurantRef, {
          caTotal: 0,
          lastUpdated: new Date().toISOString()
        });
      }

      // Récupérer les données des employés
      const employeesRef = collection(db, 'users');
      const employeesSnapshot = await getDocs(employeesRef);
      
      const employeesData: Employee[] = [];
      employeesSnapshot.forEach((doc) => {
        const data = doc.data();
        employeesData.push({
          id: doc.id,
          nom: data.nom || '',
          prenom: data.prenom || '',
          chiffreAffaire: data.chiffreAffaire || 0,
          poste: data.poste || ''
        });
      });

      setEmployees(employeesData);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      Alert.alert("Erreur", "Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le CA d'un employé
  const updateEmployeeCA = (id: string, newCA: number) => {
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, chiffreAffaire: newCA } : emp
    ));
  };

  // Sauvegarder toutes les modifications
  const saveChanges = async () => {
    setSaving(true);
    try {
      // Mettre à jour le CA du restaurant
      const restaurantRef = doc(db, 'restaurant', 'finances');
      await updateDoc(restaurantRef, {
        caTotal: restaurantCA,
        lastUpdated: new Date().toISOString()
      });

      // Mettre à jour le CA de chaque employé
      for (const employee of employees) {
        const employeeRef = doc(db, 'users', employee.id);
        await updateDoc(employeeRef, {
          chiffreAffaire: employee.chiffreAffaire
        });
      }

      Alert.alert("Succès", "Les données ont été mises à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications");
    } finally {
      setSaving(false);
    }
  };

  // Calculer la somme des CA des employés
  const calculateTotalEmployeesCA = () => {
    return employees.reduce((total, emp) => total + emp.chiffreAffaire, 0);
  };

  // Filtrer et trier les employés
  const filteredEmployees = employees
    .filter(emp => 
      emp.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
      emp.prenom.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
      } else {
        return b.chiffreAffaire - a.chiffreAffaire;
      }
    });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#194A8D', '#083F8C']}
        style={styles.background}
      />
      
      <Header title="Gestion du Chiffre d'Affaires" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CAE1EF" />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chiffre d&apos;Affaires du Restaurant</Text>
            <View style={styles.caContainer}>
              <Text style={styles.label}>CA Total (€):</Text>
              <TextInput
                style={styles.input}
                value={restaurantCA.toString()}
                onChangeText={(text) => setRestaurantCA(Number(text) || 0)}
                keyboardType="numeric"
                placeholder="Entrez le CA total"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CA des Employés</Text>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un employé..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <View style={styles.sortButtons}>
                <TouchableOpacity 
                  style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]} 
                  onPress={() => setSortBy('name')}
                >
                  <Text style={styles.sortButtonText}>Nom</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.sortButton, sortBy === 'ca' && styles.sortButtonActive]} 
                  onPress={() => setSortBy('ca')}
                >
                  <Text style={styles.sortButtonText}>CA</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {filteredEmployees.length === 0 ? (
              <Text style={styles.noEmployeeText}>Aucun employé trouvé</Text>
            ) : (
              filteredEmployees.map((employee) => (
                <View key={employee.id} style={styles.employeeCard}>
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>
                      {employee.prenom} {employee.nom}
                    </Text>
                    <Text style={styles.employeePosition}>{employee.poste}</Text>
                  </View>
                  <View style={styles.employeeCAContainer}>
                    <Text style={styles.label}>CA (€):</Text>
                    <TextInput
                      style={styles.employeeCAInput}
                      value={employee.chiffreAffaire.toString()}
                      onChangeText={(text) => updateEmployeeCA(employee.id, Number(text) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ))
            )}

            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>
                Total CA des employés: {calculateTotalEmployeesCA()} €
              </Text>
              <Text style={styles.summaryText}>
                Différence: {restaurantCA - calculateTotalEmployeesCA()} €
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveChanges}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <FontAwesome5 name="save" size={18} color="white" />
                <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#CAE1EF',
    marginTop: 10,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,        
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#194A8D',
    marginBottom: 16,
  },
  caContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  input: {
    flex: 2,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    fontSize: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 8,
    backgroundColor: '#F0F0F0',
  },
  sortButtonActive: {
    backgroundColor: '#CAE1EF',
  },
  sortButtonText: {
    color: '#194A8D',
    fontWeight: '600',
  },
  employeeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  employeeInfo: {
    flex: 2,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  employeePosition: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  employeeCAContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeCAInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F9F9F9',
    textAlign: 'right',
  },
  noEmployeeText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  summaryContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#194A8D',
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#194A8D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 30,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default CAManagement;