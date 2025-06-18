import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '@/app/components/Header';
import { createRestaurantWithAccess } from '../firebase/firebaseRestaurant';
import { auth } from '../firebase/firebaseConfig';

interface RestaurantFormData {
  restaurantId: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
}

export default function CreateRestaurant() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RestaurantFormData>({
    restaurantId: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    openTime: '09:00',
    closeTime: '22:00',
  });

  const handleInputChange = (field: keyof RestaurantFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.restaurantId.trim()) {
      Alert.alert('Erreur', 'L\'ID du restaurant est obligatoire');
      return false;
    }

    if (formData.restaurantId.length < 3) {
      Alert.alert('Erreur', 'L\'ID du restaurant doit contenir au moins 3 caractères');
      return false;
    }

    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom du restaurant est obligatoire');
      return false;
    }

    if (!formData.openTime || !formData.closeTime) {
      Alert.alert('Erreur', 'Les heures d\'ouverture et de fermeture sont obligatoires');
      return false;
    }

    // Vérifier que l'utilisateur est connecté
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Vous devez être connecté pour créer un restaurant');
      return false;
    }

    return true;
  };

  const handleCreateRestaurant = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      console.log('🏗️ Création du restaurant avec Custom Claims:', formData.restaurantId);

      // Créer le restaurant avec accès manager automatique via Custom Claims
      const result = await createRestaurantWithAccess({
        id: formData.restaurantId.trim(),
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        ownerId: auth.currentUser!.uid,
      });

      console.log('✅ Restaurant créé avec succès:', result);

      Alert.alert(
        'Restaurant créé !',
        `Le restaurant "${formData.name}" a été créé avec succès. Vous avez automatiquement les droits de manager grâce à notre système sécurisé.`,
        [
          {
            text: 'Continuer',
            onPress: () => router.replace('/restaurant')
          }
        ]
      );

    } catch (error) {
      console.error('❌ Erreur lors de la création du restaurant:', error);
      
      let errorMessage = 'Une erreur s\'est produite lors de la création du restaurant';
      if (error instanceof Error) {
        if (error.message.includes('existe déjà')) {
          errorMessage = 'Un restaurant avec cet ID existe déjà. Veuillez choisir un autre ID.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Vous n\'avez pas les permissions nécessaires pour créer un restaurant.';
        } else {
          errorMessage += ': ' + error.message;
        }
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reglageMenuItems = [
    {
      label: 'Retour',
      onPress: () => router.back()
    },
    {
      label: 'Accueil',
      onPress: () => router.push('/home' as any)
    },
    {
      label: 'Profil',
      onPress: () => router.push('/Profil/avatar' as any)
    },
    {
      label: 'Déconnexion',
      onPress: () => {},
      isLogout: true
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Créer mon restaurant" 
        showBackButton={true}
        backgroundColor="#194A8D"
        textColor="#FFFFFF"
        useHeadComponent={true}
        customBackRoute="/restaurant"
        showReglage={true}
        reglageMenuItems={reglageMenuItems}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Identifiants du restaurant</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ID du restaurant *</Text>
            <TextInput
              style={styles.input}
              value={formData.restaurantId}
              onChangeText={(value) => handleInputChange('restaurantId', value)}
              placeholder="restaurant_123"
              placeholderTextColor="#999"
              autoCapitalize="none"
              maxLength={50}
            />
            <Text style={styles.helpText}>
              ID unique pour votre restaurant (lettres, chiffres, tirets autorisés)
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Informations générales</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom du restaurant *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Mon Restaurant"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              placeholder="123 Rue de la Gastronomie, Paris"
              placeholderTextColor="#999"
              multiline
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="01 23 45 67 89"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="contact@restaurant.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Horaires d&apos;ouverture</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Ouverture *</Text>
              <TextInput
                style={styles.input}
                value={formData.openTime}
                onChangeText={(value) => handleInputChange('openTime', value)}
                placeholder="08:00"
                placeholderTextColor="#999"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Fermeture *</Text>
              <TextInput
                style={styles.input}
                value={formData.closeTime}
                onChangeText={(value) => handleInputChange('closeTime', value)}
                placeholder="22:00"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <Pressable 
            style={[styles.createButton, loading && styles.createButtonDisabled]} 
            onPress={handleCreateRestaurant}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="restaurant" size={24} color="#fff" />
                <Text style={styles.createButtonText}>Créer mon restaurant</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#194A8D',
  },
  content: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    margin: 10,
    borderRadius: 20,
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#194A8D',
    marginTop: 24,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  switchGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#194A8D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
