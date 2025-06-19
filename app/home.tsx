import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import Reglage from './components/reglage';
import Head from './components/Head';
import RestaurantStatus from './restaurant/components/RestaurantStatus';

export default function Home() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../assets/fonts/AlexBrush-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>

      <Reglage position={{ top: 5, right: 15 }}/>

      <Head title="Le Challenge " />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Section Bienvenue */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Accueil</Text>
          <LinearGradient
            colors={['transparent', '#CAE1EF', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.separator}
          />
          <Text style={styles.welcomeText}>Accédez à toutes les fonctionnalités de votre restaurant</Text>
        </View>

        {/* Section Service */}
        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Service</Text>
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
              onPress={() => router.push('/service')}
            >
              <MaterialIcons name="table-restaurant" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Espace Service</Text>
              <Text style={styles.cardDescription}>
                Gestion des tables et commandes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/service/(tabs)/plan_de_salle')}
            >
              <MaterialIcons name="restaurant" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Plan de Salle</Text>
              <Text style={styles.cardDescription}>
                Visualiser l'état des tables
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Cuisine */}
        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Cuisine</Text>
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
              onPress={() => router.push('/cuisine')}
            >
              <MaterialIcons name="kitchen" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Espace Cuisine</Text>
              <Text style={styles.cardDescription}>
                Gestion des commandes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/cuisine/(tabs)/stock')}
            >
              <MaterialIcons name="inventory" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Stock</Text>
              <Text style={styles.cardDescription}>
                Gestion des stocks
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Management */}
        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Gestion</Text>
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
              onPress={() => router.push('/manageur/home')}
            >
              <MaterialIcons name="business-center" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Management</Text>
              <Text style={styles.cardDescription}>
                Gestion générale
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/mission')}
            >
              <MaterialIcons name="assignment" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Missions</Text>
              <Text style={styles.cardDescription}>
                Gestion des tâches
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Restaurant & Configuration */}
        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Configuration</Text>
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
              onPress={() => router.push('/connexion')}
            >
              <MaterialIcons name="login" size={40} color="#194A8D" />
              <Text style={styles.cardTitle}>Connexion</Text>
              <Text style={styles.cardDescription}>
                Gestion des utilisateurs
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>© Le Challenge</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#194A8D',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },
  welcomeTitle: {
    fontSize: 32,
    color: '#194A8D',
    marginBottom: 10,
    fontFamily: 'AlexBrush',
    letterSpacing: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#194A8D',
    textAlign: 'center',
    marginTop: 10,
  },
  separator: {
    height: 4,
    width: '80%',
    marginBottom: 10,
  },
  restaurantStatus: {
    marginTop: 10,
    marginBottom: 15,
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
  footer: {
    marginTop: 15,
    alignItems: 'center',
  },
  footerText: {
    color: '#CAE1EF',
    fontSize: 14,
  },
  // Styles obsolètes gardés pour compatibilité
  logoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 15,
    right: 15,
    zIndex: 15,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CAE1EF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 60,
    right: 15,
    backgroundColor: 'transparent',
  },
  dropdownContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
    elevation: 5,
    minWidth: 180,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  menuItemText: {
    fontSize: 16,
    color: '#194A8D',
  },
  logoutItem: {
    borderBottomWidth: 0,
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    color: '#D32F2F',
  },
});
