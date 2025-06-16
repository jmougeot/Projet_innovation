import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRestaurantSelection } from '../RestaurantSelectionContext';

/**
 * Composant qui affiche une notification temporaire quand le restaurant change
 */
function RestaurantChangeNotification() {
  const { selectedRestaurant } = useRestaurantSelection();
  const [previousRestaurant, setPreviousRestaurant] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (selectedRestaurant && previousRestaurant && selectedRestaurant.name !== previousRestaurant) {
      // Le restaurant a changé, afficher la notification
      setShowNotification(true);
      
      // Animation d'apparition
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000), // Afficher pendant 2 secondes
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowNotification(false);
      });
    }

    // Mettre à jour le restaurant précédent
    setPreviousRestaurant(selectedRestaurant?.name || null);
  }, [selectedRestaurant]);

  if (!showNotification || !selectedRestaurant) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.notification}>
        <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Restaurant sélectionné</Text>
          <Text style={styles.restaurantName}>{selectedRestaurant.name}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#194A8D',
    marginTop: 2,
  },
});

export default RestaurantChangeNotification;
