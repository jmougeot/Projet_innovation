import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import restaurantStorage from '@/app/asyncstorage/restaurantStorage';

interface RestaurantSelectorProps {
  style?: any;
}

export default function RestaurantSelector({ style }: RestaurantSelectorProps) {
  const [CurrentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const loadRestaurantId = async () => {
      try {
        const savedId = await restaurantStorage.GetSelectedRestaurantId();
        setCurrentRestaurantId(savedId);
      } catch (error) {
        console.error('Erreur chargement restaurant ID:', error);
      }
    };
    loadRestaurantId();
  }, []);

  const handleNavigateToSelector = () => {
    router.push('/restaurant/select' as any);
  };


  return (
    <View style={[styles.container, style]}>
      <Pressable style={styles.selectorButton} onPress={handleNavigateToSelector}>
        <LinearGradient
          colors={['#D4AF37', '#B8941F']}
          style={styles.buttonGradient}
        >
          <Text style={styles.CurrentRestaurantId}>
            {CurrentRestaurantId ? CurrentRestaurantId : 'Sélectionner un restaurant'}
          </Text>
          <Text style={styles.changeText}>Appuyer pour changer</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selectorButton: {
    borderRadius: 12,
    elevation: 3,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',

  },
  buttonGradient: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  CurrentRestaurantId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  changeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  noUserText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 16,
  },
});
