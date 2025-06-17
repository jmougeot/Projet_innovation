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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '@/app/components/Header';
import { useRestaurant } from './SelectionContext';
import { initializeRestaurant, addUserMember, addUserMemberWithUserId } from '../firebase/firebaseRestaurant';
import type { Restaurant, RestaurantSettings } from '../firebase/firebaseRestaurant';

interface RestaurantFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  kitchenCapacity: string;
  currency: string;
  taxRate: string;
  serviceCharge: string;
  defaultRoomName: string;
  migrateExistingData: boolean;
}

export default function CreateRestaurant() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user } = useRestaurant();
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    openTime: '08:00',
    closeTime: '22:00',
    kitchenCapacity: '50',
    currency: 'EUR',
    taxRate: '20',
    serviceCharge: '0',
    defaultRoomName: 'Salle principale',
    migrateExistingData: true,
  });

  const handleInputChange = (field: keyof RestaurantFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom du restaurant est obligatoire');
      return false;
    }

    if (!formData.openTime || !formData.closeTime) {
      Alert.alert('Erreur', 'Les heures d\'ouverture et de fermeture sont obligatoires');
      return false;
    }

    const kitchenCapacity = parseInt(formData.kitchenCapacity);
    if (isNaN(kitchenCapacity) || kitchenCapacity <= 0) {
      Alert.alert('Erreur', 'La capacité de la cuisine doit être un nombre positif');
      return false;
    }

    const taxRate = parseFloat(formData.taxRate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      Alert.alert('Erreur', 'Le taux de TVA doit être compris entre 0 et 100');
      return false;
    }

    const serviceCharge = parseFloat(formData.serviceCharge);
    if (isNaN(serviceCharge) || serviceCharge < 0 || serviceCharge > 100) {
      Alert.alert('Erreur', 'Les frais de service doivent être compris entre 0 et 100');
      return false;
    }

    return true;
  };

  const handleCreateRestaurant = async () => {
    if (!validateForm()) return;

    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour créer un restaurant');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting restaurant creation for user:', user.uid);

      const restaurantSettings: RestaurantSettings = {
        business_hours: {
          open_time: formData.openTime,
          close_time: formData.closeTime,
          days_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        },
        table_service_time: 90,
        kitchen_capacity: parseInt(formData.kitchenCapacity),
        currency: formData.currency,
        tax_rate: parseFloat(formData.taxRate) / 100,
        service_charge: parseFloat(formData.serviceCharge) / 100,
        default_room_name: formData.defaultRoomName.trim() || 'Salle principale'
      };

      const restaurantData: Partial<Restaurant> = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        settings: restaurantSettings,
      };

      console.log('Creating restaurant with data:', restaurantData);

      // Create the restaurant and get its ID
      const restaurantId = await initializeRestaurant(restaurantData);
      console.log('Restaurant created with ID:', restaurantId);

      // Create access record for the creator as manager
      console.log('Creating initial user member for manager...');
      await addUserMemberWithUserId(restaurantId, {
        name: user.displayName || user.email?.split('@')[0] || 'Manager',
        email: user.email || '',
        role: 'manager'
      }, user.uid);
      console.log('Initial user member created successfully');

      // Navigate to restaurant selection
      console.log('Navigating to restaurant selection...');
      router.replace('/restaurant/select');

    } catch (error) {
      console.error('Erreur lors de la création du restaurant:', error);
      
      // More detailed error message
      let errorMessage = 'Une erreur s\'est produite lors de la création du restaurant';
      if (error instanceof Error) {
        errorMessage += ': ' + error.message;
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

          <Text style={styles.sectionTitle}>Configuration opérationnelle</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Capacité de la cuisine (commandes simultanées) *</Text>
            <TextInput
              style={styles.input}
              value={formData.kitchenCapacity}
              onChangeText={(value) => handleInputChange('kitchenCapacity', value)}
              placeholder="50"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom de la salle par défaut</Text>
            <TextInput
              style={styles.input}
              value={formData.defaultRoomName}
              onChangeText={(value) => handleInputChange('defaultRoomName', value)}
              placeholder="Salle principale"
              placeholderTextColor="#999"
            />
          </View>

          <Text style={styles.sectionTitle}>Paramètres financiers</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Devise</Text>
              <TextInput
                style={styles.input}
                value={formData.currency}
                onChangeText={(value) => handleInputChange('currency', value)}
                placeholder="EUR"
                placeholderTextColor="#999"
                maxLength={3}
                autoCapitalize="characters"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>TVA (%)</Text>
              <TextInput
                style={styles.input}
                value={formData.taxRate}
                onChangeText={(value) => handleInputChange('taxRate', value)}
                placeholder="20"
                placeholderTextColor="#999"
                keyboardType="numeric"
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
});
