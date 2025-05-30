import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Head from '@/app/components/Head';

// Page d'accueil des missions
const MissionHome = () => {
  
  return (
    <SafeAreaView style={styles.container}>
      <Head title="Missions" />      
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push('/mission/UserMissionsPage' as any )}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="list" size={24} color="#1890ff" />
          <Text style={styles.cardTitle}>Mes missions</Text>
        </View>
        <Text style={styles.cardDescription}>
          Consultez et gérez vos missions actives
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push('/mission/AllMissionsPage' as any)}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="search" size={24} color="#1890ff" />
          <Text style={styles.cardTitle}>Toutes les missions</Text>
        </View>
        <Text style={styles.cardDescription}>
          Découvrez et rejoignez de nouvelles missions
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push('/mission/CreateMissionPage' as any)}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="add-circle" size={24} color="#1890ff" />
          <Text style={styles.cardTitle}>Créer une mission</Text>
        </View>
        <Text style={styles.cardDescription}>
          Créez une nouvelle mission pour vous ou votre équipe
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push('/mission/ProgressBarDemo' as any)}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="analytics" size={24} color="#1890ff" />
          <Text style={styles.cardTitle}>Démo des barres de progression</Text>
        </View>
        <Text style={styles.cardDescription}>
          Découvrez les nouvelles barres de progression avec valeurs absolues
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#194A8D',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default MissionHome;
