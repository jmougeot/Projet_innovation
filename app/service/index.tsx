import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import Reglage from '@/app/components/reglage';
import { getServiceMenuItems } from './components/ServiceNavigation';

export default function ServiceHome() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../assets/fonts/AlexBrush-Regular.ttf'),
  });

  const customMenuItems = getServiceMenuItems();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Reglage position={{ top: 0, right: 15 }} menuItems={customMenuItems} />
      
      <View style={styles.headerSquare}>
        <Text style={styles.headerSquareText}>Espace Service</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Navigation principale */}
        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Navigation rapide</Text>
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
              onPress={() => router.push('/service/(tabs)' as any)}
            >
              <MaterialIcons name="table-restaurant" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Navigation Service</Text>
              <Text style={styles.cardDescription}>
                Accès aux outils de service
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/service/(tabs)/plan_de_salle' as any)}
            >
              <MaterialIcons name="restaurant" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Plan de salle</Text>
              <Text style={styles.cardDescription}>
                Visualiser et gérer les tables
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Actions rapides</Text>
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
              onPress={() => router.push('/service/(tabs)' as any)}
            >
              <MaterialIcons name="restaurant-menu" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Cuisine Service</Text>
              <Text style={styles.cardDescription}>
                Suivi des commandes en cuisine
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/service/(tabs)/AffichageMission' as any)}
            >
              <MaterialIcons name="assignment" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Missions Service</Text>
              <Text style={styles.cardDescription}>
                Consulter et gérer les missions
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gestion avancée */}
        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Gestion avancée</Text>
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
              onPress={() => router.push('/restaurant' as any)}
            >
              <MaterialIcons name="business" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Mon Restaurant</Text>
              <Text style={styles.cardDescription}>
                Configuration et paramètres
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/service/commande/map_settings' as any)}
            >
              <MaterialIcons name="edit-location" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Modifier le plan</Text>
              <Text style={styles.cardDescription}>
                Configurer le plan de salle
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/mission/pages/CreateMissionPage' as any)}
            >
              <MaterialIcons name="add-task" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Créer mission</Text>
              <Text style={styles.cardDescription}>
                Ajouter une nouvelle mission
              </Text>
            </TouchableOpacity>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerSquareText: {
    color: '#083F8C',
    fontWeight: 'bold',
    fontSize: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
