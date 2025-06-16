import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { useRestaurant } from '../restaurant/SelectionContext';

export default function RestaurantChangeAlert() {
  const [alertVisible, setAlertVisible] = useState(false);
  const [previousRestaurant, setPreviousRestaurant] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const { currentRestaurant } = useRestaurant();

  useEffect(() => {
    if (currentRestaurant && previousRestaurant && currentRestaurant.id !== previousRestaurant) {
      // Restaurant has changed, show alert
      setAlertVisible(true);
      
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        hideAlert();
      }, 3000);

      return () => clearTimeout(timer);
    }
    
    if (currentRestaurant) {
      setPreviousRestaurant(currentRestaurant.id);
    }
  }, [currentRestaurant]);

  const hideAlert = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setAlertVisible(false);
    });
  };

  if (!alertVisible || !currentRestaurant) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.alertContainer, 
        { opacity: fadeAnim }
      ]}
    >
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>Restaurant changé</Text>
        <Text style={styles.alertText}>
          Vous êtes maintenant connecté à: {currentRestaurant.name}
        </Text>
        <Pressable style={styles.dismissButton} onPress={hideAlert}>
          <Text style={styles.dismissText}>OK</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  alertContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
    elevation: 10,
  },
  alertContent: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
    lineHeight: 18,
  },
  dismissButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dismissText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
