import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Head from '@/app/components/Head';

export default function ServiceHome() {
  return (
    <SafeAreaView style={styles.container}>
      <Head title="Service" />
      
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/service/(tabs)/plan_de_salle' as any )}
        >
          <MaterialIcons name="restaurant" size={32} color="#1890ff" />
          <Text style={styles.cardTitle}>Plan de salle</Text>
          <Text style={styles.cardDescription}>
            Visualiser et gérer les tables du restaurant
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/service/(tabs)' as any)}
        >
          <MaterialIcons name="point-of-sale" size={32} color="#1890ff" />
          <Text style={styles.cardTitle}>Cuisine Service</Text>
          <Text style={styles.cardDescription}>
            Suivre et coordonner les commandes en cuisine
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/service/(tabs)/AffichageMission' as any)}
        >
          <MaterialIcons name="assignment" size={32} color="#1890ff" />
          <Text style={styles.cardTitle}>Missions Service</Text>
          <Text style={styles.cardDescription}>
            Consulter et gérer vos missions du service
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/service/commande/change_plan' as any)}
        >
          <MaterialIcons name="dashboard" size={32} color="#52c41a" />
          <Text style={styles.cardTitle}>Gestion des Tables</Text>
          <Text style={styles.cardDescription}>
            Organiser le plan de salle - Système simplifié
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
