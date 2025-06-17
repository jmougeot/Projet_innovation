import React, { useState, useEffect } from 'react';
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
import { useRestaurant } from './SelectionContext';
import {
  getRestaurant,
  updateRestaurant,
  clearRestaurantCache
} from '../firebase/firebaseRestaurant';
import type { Restaurant, RestaurantSettings } from '../firebase/firebaseRestaurant';

interface SettingsFormData {
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
}

export default function RestaurantSettingsPage() {
  const router = useRouter();
  const { currentRestaurant } = useRestaurant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState<SettingsFormData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    openTime: '',
    closeTime: '',
    kitchenCapacity: '',
    currency: '',
    taxRate: '',
    serviceCharge: '',
    defaultRoomName: '',
  });

  useEffect(() => {
    loadRestaurant();
  }, [currentRestaurant]);

  const loadRestaurant = async () => {
    if (!currentRestaurant) {
      Alert.alert('Erreur', 'Aucun restaurant sélectionné');
      router.push('/restaurant/select' as any);
      return;
    }

    try {
      setLoading(true);
      const restaurantData = await getRestaurant(currentRestaurant.id, false);

      if (restaurantData) {
        setRestaurant(restaurantData);
        setFormData({
          name: restaurantData.name || '',
          address: restaurantData.address || '',
          phone: restaurantData.phone || '',
          email: restaurantData.email || '',
          openTime: restaurantData.settings.business_hours.open_time || '',
          closeTime: restaurantData.settings.business_hours.close_time || '',
          kitchenCapacity: restaurantData.settings.kitchen_capacity.toString(),
          currency: restaurantData.settings.currency || '',
          taxRate: (restaurantData.settings.tax_rate * 100).toString(),
          serviceCharge: (restaurantData.settings.service_charge * 100).toString(),
          defaultRoomName: restaurantData.settings.default_room_name || '',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du restaurant:', error);
      Alert.alert('Erreur', 'Impossible de charger les paramètres du restaurant');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SettingsFormData, value: string) => {
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

  const handleSaveSettings = async () => {
    if (!validateForm()) return;

    if (!currentRestaurant) {
      Alert.alert('Erreur', 'Aucun restaurant sélectionné');
      return;
    }

    try {
      setSaving(true);

      const restaurantSettings: RestaurantSettings = {
        business_hours: {
          open_time: formData.openTime,
          close_time: formData.closeTime,
          days_of_week: restaurant?.settings.business_hours.days_of_week || 
            ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        },
        table_service_time: restaurant?.settings.table_service_time || 90,
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

      await updateRestaurant(currentRestaurant.id, restaurantData);

      // Reload restaurant data
      await loadRestaurant();
      
      Alert.alert('Succès', 'Paramètres sauvegardés avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = () => {
    clearRestaurantCache();
    Alert.alert('Cache vidé', 'Le cache du restaurant a été vidé avec succès');
  };

  const reglageMenuItems = [
    {
      label: 'Retour',
      onPress: () => router.back()
    },
    {
      label: 'Accueil',
      onPress: () => router.push('/home')
    },
    {
      label: 'Profil',
      onPress: () => router.push('/Profil/avatar')
    },
    {
      label: 'Déconnexion',
      onPress: () => {},
      isLogout: true
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Paramètres du restaurant" 
          showBackButton={true}
          backgroundColor="#194A8D"
          textColor="#FFFFFF"
          useHeadComponent={true}
          customBackRoute="/restaurant"
          showReglage={true}
          reglageMenuItems={reglageMenuItems}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#194A8D" />
          <Text style={styles.loadingText}>Chargement des paramètres...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Paramètres du restaurant" 
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Frais de service (%)</Text>
            <TextInput
              style={styles.input}
              value={formData.serviceCharge}
              onChangeText={(value) => handleInputChange('serviceCharge', value)}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <Pressable 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="save" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Sauvegarder les paramètres</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.sectionTitle}>Gestion des données</Text>

          <View style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <MaterialIcons name="clear" size={24} color="#FF6B6B" />
              <Text style={[styles.actionTitle, { color: '#FF6B6B' }]}>Cache</Text>
            </View>
            <Text style={styles.actionDescription}>
              Vider le cache du restaurant pour forcer un rechargement
            </Text>
            <Pressable 
              style={[styles.actionButton, { borderColor: '#FF6B6B' }]} 
              onPress={handleClearCache}
            >
              <Text style={[styles.actionButtonText, { color: '#FF6B6B' }]}>Vider le cache</Text>
            </Pressable>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3EFEF',
    margin: 10,
    borderRadius: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#194A8D',
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
  saveButton: {
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#194A8D',
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    borderWidth: 2,
    borderColor: '#194A8D',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#194A8D',
    fontSize: 16,
    fontWeight: '600',
  },
});
