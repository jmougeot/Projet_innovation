import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRestaurantSelection } from '../restaurant/RestaurantSelectionContext';
import { Restaurant } from '../firebase/firebaseRestaurant';

interface RestaurantSelectorProps {
  style?: any;
}

export default function RestaurantSelector({ style }: RestaurantSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const {
    selectedRestaurant,
    availableRestaurants,
    selectRestaurant,
    clearRestaurantSelection,
    restaurantsLoading,
    selectionLoading,
    user,
  } = useRestaurantSelection();

  const handleRestaurantSelect = async (restaurantId: string) => {
    try {
      await selectRestaurant(restaurantId);
      setModalVisible(false);
    } catch (error) {
      console.error('Erreur lors de la sélection du restaurant:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner ce restaurant');
    }
  };

  const handleClearSelection = () => {
    Alert.alert(
      'Désélectionner le restaurant',
      'Êtes-vous sûr de vouloir désélectionner le restaurant actuel ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          style: 'destructive',
          onPress: () => {
            clearRestaurantSelection();
            setModalVisible(false);
          }
        },
      ]
    );
  };

  const handleCreateRestaurant = () => {
    setModalVisible(false);
    router.push('/restaurant/create');
  };

  const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
    <Pressable
      style={[
        styles.restaurantItem,
        selectedRestaurant?.id === item.id && styles.selectedItem
      ]}
      onPress={() => handleRestaurantSelect(item.id)}
    >
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <Text style={styles.restaurantAddress}>{item.address}</Text>
      </View>
      {selectedRestaurant?.id === item.id && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>✓</Text>
        </View>
      )}
    </Pressable>
  );

  if (!user) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.noUserText}>Connectez-vous pour sélectionner un restaurant</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Pressable
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
        disabled={restaurantsLoading || selectionLoading}
      >
        <LinearGradient
          colors={['#CAE1EF', '#87CEEB']}
          style={styles.buttonGradient}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonLabel}>Restaurant sélectionné:</Text>
            <Text style={styles.buttonText}>
              {restaurantsLoading ? 'Chargement...' : 
               selectedRestaurant ? selectedRestaurant.name : 'Aucun restaurant sélectionné'}
            </Text>
            <Text style={styles.buttonHint}>Appuyez pour changer</Text>
          </View>
        </LinearGradient>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un restaurant</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            {availableRestaurants.length === 0 ? (
              <View style={styles.noRestaurantsContainer}>
                <Text style={styles.noRestaurantsText}>
                  Aucun restaurant disponible
                </Text>
                <Text style={styles.noRestaurantsSubtext}>
                  Créez votre premier restaurant ou contactez un administrateur pour accéder à un restaurant existant
                </Text>
                <Pressable
                  style={styles.createButton}
                  onPress={handleCreateRestaurant}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#45a049']}
                    style={styles.createButtonGradient}
                  >
                    <Text style={styles.createButtonText}>
                      + Créer un nouveau restaurant
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : (
              <>
                <FlatList
                  data={availableRestaurants}
                  renderItem={renderRestaurantItem}
                  keyExtractor={(item) => item.id}
                  style={styles.restaurantList}
                  showsVerticalScrollIndicator={false}
                />

                {selectedRestaurant && (
                  <Pressable
                    style={styles.clearButton}
                    onPress={handleClearSelection}
                  >
                    <Text style={styles.clearButtonText}>
                      Désélectionner le restaurant
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.addRestaurantButton}
                  onPress={handleCreateRestaurant}
                >
                  <Text style={styles.addRestaurantText}>
                    + Ajouter un nouveau restaurant
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  selectorButton: {
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonGradient: {
    borderRadius: 15,
    padding: 20,
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 14,
    color: '#194A8D',
    fontWeight: '600',
    marginBottom: 5,
  },
  buttonText: {
    fontSize: 18,
    color: '#194A8D',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },
  buttonHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  noUserText: {
    fontSize: 16,
    color: '#CAE1EF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#194A8D',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  restaurantList: {
    maxHeight: 400,
  },
  restaurantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#E8F4FD',
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#194A8D',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
  },
  selectedIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noRestaurantsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noRestaurantsText: {
    fontSize: 18,
    color: '#194A8D',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  noRestaurantsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  clearButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addRestaurantButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    alignItems: 'center',
  },
  addRestaurantText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
