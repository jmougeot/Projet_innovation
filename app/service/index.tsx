import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import Reglage from '@/app/components/reglage';
import AutoRedirect from '@/app/restaurant/AutoRedirect';
import { getServiceMenuItems } from './components/ServiceNavigation';

export default function ServiceHome() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../assets/fonts/AlexBrush-Regular.ttf'),
  });
  const [activeServices, setActiveServices] = useState({
    tables: 0,
    commandes: 0,
    missions: 0
  });

  const customMenuItems = getServiceMenuItems();

  useEffect(() => {
    // Simulation de données en temps réel - à remplacer par de vraies données
    const interval = setInterval(() => {
      setActiveServices({
        tables: Math.floor(Math.random() * 20) + 1,
        commandes: Math.floor(Math.random() * 15) + 1,
        missions: Math.floor(Math.random() * 8) + 1
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AutoRedirect requireRestaurant={true} loadingMessage="Vérification du restaurant sélectionné...">
      <SafeAreaView style={styles.container}>
        <Reglage position={{ top: 0, right: 15 }} menuItems={customMenuItems} />
        
        <View style={styles.headerSquare}>
          <Text style={styles.headerSquareText}>Espace Service</Text>
        </View>

        {/* Tableau de bord en temps réel */}
        <View style={styles.dashboardContainer}>
          <Text style={styles.dashboardTitle}>Tableau de bord Service</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <MaterialIcons name="table-restaurant" size={24} color="#194A8D" />
              <Text style={styles.statNumber}>{activeServices.tables}</Text>
              <Text style={styles.statLabel}>Tables actives</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="receipt" size={24} color="#194A8D" />
              <Text style={styles.statNumber}>{activeServices.commandes}</Text>
              <Text style={styles.statLabel}>Commandes</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="assignment" size={24} color="#194A8D" />
              <Text style={styles.statNumber}>{activeServices.missions}</Text>
              <Text style={styles.statLabel}>Missions</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Gestion des Tables - Section Service uniquement */}
        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Gestion des Tables</Text>
            <View style={styles.categorySeparatorContainer}>
              <LinearGradient
                colors={['transparent', '#CAE1EF', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.categorySeparator}
              />
            </View>
          </View>
          
          <View style={styles.menuGrid}>
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/service/(tabs)/plan_de_salle')}
            >
              <MaterialIcons name="table-restaurant" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Plan de Salle</Text>
              <Text style={styles.cardDescription}>
                Visualiser et gérer toutes les tables
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/service/commande/map_settings')}
            >
              <MaterialIcons name="edit-location" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Modifier Plan</Text>
              <Text style={styles.cardDescription}>
                Configurer l'agencement des tables
              </Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* Suivi Cuisine - Section Service uniquement */}
        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Suivi Cuisine</Text>
            <View style={styles.categorySeparatorContainer}>
              <LinearGradient
                colors={['transparent', '#CAE1EF', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.categorySeparator}
              />
            </View>
          </View>
          
          <View style={styles.menuGrid}>
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/service/(tabs)/kitchen')}
            >
              <MaterialIcons name="kitchen" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>État Cuisine</Text>
              <Text style={styles.cardDescription}>
                Suivi des plats en préparation
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/service/(tabs)/AffichageMission')}
            >
              <MaterialIcons name="assignment" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Missions Service</Text>
              <Text style={styles.cardDescription}>
                Tâches spécifiques au service
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </AutoRedirect>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#194A8D',
    padding: 10,
  },
  headerSquare: {
    alignSelf: 'center',
    backgroundColor: '#CAE1EF',
    width: 200,
    height: 40,
    marginBottom: 20,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  headerSquareText: {
    color: '#083F8C',
    fontWeight: 'bold',
    fontSize: 20,
  },
  dashboardContainer: {
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#194A8D',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'AlexBrush',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCard: {
    backgroundColor: '#CAE1EF',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    minWidth: 80,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#194A8D',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#194A8D',
    textAlign: 'center',
    marginTop: 3,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
    padding: 15,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#194A8D',
    textAlign: 'right',
    paddingRight: 15,
    letterSpacing: 1,
    fontFamily: 'AlexBrush',
  },
  categorySeparatorContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  categorySeparator: {
    height: 3,
    width: '100%',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  card: {
    backgroundColor: '#CAE1EF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    width: '48%',
    minHeight: 120,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#194A8D',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 12,
    color: '#194A8D',
    textAlign: 'center',
    opacity: 0.8,
  },
});
