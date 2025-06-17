import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useRestaurant } from '../restaurant/SelectionContext';

interface RestaurantStatusProps {
  style?: any;
  showChangeButton?: boolean;
}

export default function RestaurantStatus({ style, showChangeButton = true }: RestaurantStatusProps) {
  const { currentRestaurant, user, isLoading } = useRestaurant();

  const handleNavigateToSelector = () => {
    router.push('/home');
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusIndicator, 
          currentRestaurant ? styles.connected : styles.disconnected
        ]} />
        <View style={styles.textContainer}>
          <Text style={styles.label}>Restaurant:</Text>
          <Text style={styles.restaurantName}>
            {currentRestaurant ? currentRestaurant.name : 'Non sélectionné'}
          </Text>
        </View>
      </View>
      
      {showChangeButton && (
        <Pressable
          style={styles.changeButton}
          onPress={handleNavigateToSelector}
        >
          <Text style={styles.changeButtonText}>Changer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 10,
    marginVertical: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#ff4444',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#CAE1EF',
    opacity: 0.8,
  },
  restaurantName: {
    fontSize: 14,
    color: '#CAE1EF',
    fontWeight: 'bold',
    marginTop: 2,
  },
  loadingText: {
    fontSize: 14,
    color: '#CAE1EF',
    fontStyle: 'italic',
  },
  changeButton: {
    backgroundColor: 'rgba(202, 225, 239, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CAE1EF',
  },
  changeButtonText: {
    color: '#CAE1EF',
    fontSize: 12,
    fontWeight: '600',
  },
});
