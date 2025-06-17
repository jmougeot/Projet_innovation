import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Head from '@/app/components/Head';

export default function CuisineHome() {
  return (
    <SafeAreaView style={styles.container}>
      <Head title="Cuisine" />
      
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/cuisine/(tabs)/cuisine' as any)}
        >
          <MaterialIcons name="restaurant-menu" size={32} color="#1890ff" />
          <Text style={styles.cardTitle}>Cuisine</Text>
          <Text style={styles.cardDescription}>
            Gérer les commandes en cuisine
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/cuisine/(tabs)/stock' as any)}
        >
          <MaterialIcons name="inventory" size={32} color="#1890ff" />
          <Text style={styles.cardTitle}>Gestion Stock</Text>
          <Text style={styles.cardDescription}>
            Gérer le stock des ingrédients
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/cuisine/(tabs)/AffichageMission' as any)}
        >
          <MaterialIcons name="assignment" size={32} color="#1890ff" />
          <Text style={styles.cardTitle}>Missions Cuisine</Text>
          <Text style={styles.cardDescription}>
            Consulter vos missions de cuisine
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#194A8D',
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
