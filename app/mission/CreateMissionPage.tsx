import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
// Suppression de l'import du Picker original
// import { Picker } from '@react-native-picker/picker';
// Import du composant Picker personnalisé
import Picker from '../components/Picker';
import { createMission, assignMissionToUser, createCollectiveMission } from '../firebase/firebaseMission';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { MissionStackParamList } from './index';
import { get_plats, Plat } from '../firebase/firebaseMenu';

// Types
import type { Mission } from './Interface';

interface User {
  id: string;
  name: string;
  email: string;
}

// Type pour les props de navigation
type CreateMissionScreenNavigationProp = StackNavigationProp<MissionStackParamList, 'CreateMission'>;

const CreateMissionPage = () => {
  // Utiliser le hook useNavigation pour accéder à la navigation
  const navigation = useNavigation<CreateMissionScreenNavigationProp>();

  // État initial du formulaire
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    points: 10,
    frequence: 'daily' as 'daily' | 'weekly' | 'monthly',
    dateDebut: new Date(),
    isCollective: false,
    targetValue: 1,
    selectedUsers: [] as string[],
    selectedPlat: null as Plat | null
  });

  // États pour le DatePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Liste des utilisateurs à assigner
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Liste des plats disponibles
  const [plats, setPlats] = useState<Plat[]>([]);
  
  // Récupérer les utilisateurs depuis Firebase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          name: doc.data().nom || doc.data().displayName || 'Utilisateur'
        } as User));
        setUsers(usersList);
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
      }
    };
    
    fetchUsers();
  }, []);
  
  // Récupérer les plats disponibles
  useEffect(() => {
    const fetchPlats = async () => {
      try {
        const platsList = await get_plats();
        setPlats(platsList);
      } catch (error) {
        console.error('Erreur lors de la récupération des plats:', error);
        Alert.alert('Erreur', 'Impossible de charger les plats');
      }
    };
    
    fetchPlats();
  }, []);
  
  // Gestion de la date
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({...formData, dateDebut: selectedDate});
    }
  };
  
  // Gestion de la sélection des utilisateurs
  const toggleUserSelection = (userId: string) => {
    const selectedUsers = [...formData.selectedUsers];
    
    if (selectedUsers.includes(userId)) {
      // Retirer l'utilisateur s'il est déjà sélectionné
      const index = selectedUsers.indexOf(userId);
      selectedUsers.splice(index, 1);
    } else {
      // Ajouter l'utilisateur
      selectedUsers.push(userId);
    }
    
    setFormData({...formData, selectedUsers});
  };
  
  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!formData.titre || !formData.description || formData.selectedUsers.length === 0) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Préparer l'objet mission
      const missionData: Omit<Mission, 'id'> = {
        titre: formData.titre,
        description: formData.description,
        points: formData.points,
        recurrence: {
          frequence: formData.frequence,
          dateDebut: formData.dateDebut
        }
      };
      
      // Ajouter le plat si un plat est sélectionné
      if (formData.selectedPlat) {
        missionData.plat = formData.selectedPlat;
      }
      
      // Créer la mission
      const { id } = await createMission(missionData);
      
      // Si c'est une mission collective
      if (formData.isCollective) {
        await createCollectiveMission(id, formData.selectedUsers, formData.targetValue);
      } else {
        // Assigner la mission à chaque utilisateur sélectionné
        for (const userId of formData.selectedUsers) {
          await assignMissionToUser(id, userId);
        }
      }
      
      Alert.alert('Succès', 'Mission créée avec succès');
      // Naviguer vers une autre page ou réinitialiser le formulaire
      setFormData({
        titre: '',
        description: '',
        points: 10,
        frequence: 'daily',
        dateDebut: new Date(),
        isCollective: false,
        targetValue: 1,
        selectedUsers: [],
        selectedPlat: null
      });
      
      // Navigation corrigée
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la création de la mission:', error);
      Alert.alert('Erreur', 'Impossible de créer la mission');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Créer une nouvelle mission</Text>
      
      {/* Titre de la mission */}
      <Text style={styles.label}>Titre*</Text>
      <TextInput
        style={styles.input}
        value={formData.titre}
        onChangeText={(text) => setFormData({...formData, titre: text})}
        placeholder="Titre de la mission"
      />
      
      {/* Description */}
      <Text style={styles.label}>Description*</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.description}
        onChangeText={(text) => setFormData({...formData, description: text})}
        placeholder="Description détaillée de la mission"
        multiline={true}
        numberOfLines={4}
      />
      
      {/* Points */}
      <Text style={styles.label}>Points</Text>
      <TextInput
        style={styles.input}
        value={formData.points.toString()}
        onChangeText={(text) => setFormData({...formData, points: parseInt(text) || 0})}
        keyboardType="numeric"
        placeholder="Points attribués pour cette mission"
      />
      
      {/* Fréquence */}
      <Text style={styles.label}>Fréquence</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.frequence}
          onValueChange={(value) => 
            setFormData({...formData, frequence: value as 'daily' | 'weekly' | 'monthly'})
          }
          items={[
            { label: 'Quotidienne', value: 'daily' },
            { label: 'Hebdomadaire', value: 'weekly' },
            { label: 'Mensuelle', value: 'monthly' }
          ]}
          style={styles.pickerWrapper}
          pickerStyle={styles.picker}
          modalTitle="Choisissez une fréquence"
        />
      </View>
      
      {/* Date de début */}
      <Text style={styles.label}>Date de début</Text>
      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateText}>
          {formData.dateDebut.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      
      {showDatePicker && (
        <DateTimePicker
          value={formData.dateDebut}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      
      {/* Mission collective ou individuelle */}
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Mission collective</Text>
        <Switch
          value={formData.isCollective}
          onValueChange={(value) => setFormData({...formData, isCollective: value})}
        />
      </View>
      
      {/* Quantité cible (pour la progression) */}
      <Text style={styles.label}>Quantité cible</Text>
      <TextInput
        style={styles.input}
        value={formData.targetValue.toString()}
        onChangeText={(text) => setFormData({...formData, targetValue: parseInt(text) || 1})}
        keyboardType="numeric"
        placeholder="Valeur à atteindre pour la progression"
      />
      
      {/* Sélection du plat */}
      <Text style={styles.label}>Plat associé (optionnel)</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.selectedPlat?.id || ""}
          onValueChange={(value) => {
            if (value === "") {
              setFormData({...formData, selectedPlat: null});
            } else {
              const selectedPlat = plats.find(plat => plat.id === value);
              if (selectedPlat) {
                setFormData({...formData, selectedPlat});
              }
            }
          }}
          items={[
            { label: 'Sélectionner un plat', value: '' },
            ...plats.map(plat => ({
              label: plat.name || "Plat sans nom",
              value: plat.id || ""
            }))
          ]}
          style={styles.pickerWrapper}
          pickerStyle={styles.picker}
          modalTitle="Choisissez un plat"
        />
      </View>
      
      {formData.selectedPlat && (
        <View style={styles.selectedPlatInfo}>
          <Text style={styles.selectedPlatTitle}>Plat sélectionné:</Text>
          <Text style={styles.selectedPlatName}>{formData.selectedPlat.name}</Text>
          <Text style={styles.selectedPlatCategory}>Catégorie: {formData.selectedPlat.category}</Text>
          <Text style={styles.selectedPlatPrice}>Prix: {formData.selectedPlat.price}€</Text>
        </View>
      )}
      
      {/* Liste des utilisateurs */}
      <Text style={styles.label}>Sélectionner les utilisateurs*</Text>
      <View style={styles.userListContainer}>
        {users.map(user => (
          <TouchableOpacity
            key={user.id}
            style={[
              styles.userItem,
              formData.selectedUsers.includes(user.id) && styles.selectedUser
            ]}
            onPress={() => toggleUserSelection(user.id)}
          >
            <Text style={styles.userName}>{user.name}</Text>
            {formData.selectedUsers.includes(user.id) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Bouton de soumission */}
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Création en cours...' : 'Créer la mission'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    overflow: 'hidden', // Évite le débordement du contenu
  },
  pickerWrapper: {
    width: '100%',
  },
  picker: {
    borderWidth: 0, // Supprimer la bordure par défaut car le conteneur a déjà une bordure
    backgroundColor: 'transparent',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  userListContainer: {
    marginVertical: 10,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedUser: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
  },
  userName: {
    fontSize: 16,
  },
  checkmark: {
    color: '#1890ff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  button: {
    backgroundColor: '#1890ff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  buttonDisabled: {
    backgroundColor: '#bfbfbf',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedPlatInfo: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1890ff',
  },
  selectedPlatTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedPlatName: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedPlatCategory: {
    fontSize: 14,
    color: '#666',
  },
  selectedPlatPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default CreateMissionPage;
