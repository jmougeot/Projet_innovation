import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

export default function ManagerHome() {
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../assets/fonts/AlexBrush-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSquare}>
        <Text style={styles.headerSquareText}>Espace Manageur</Text>
      </View>

      <ScrollView style={styles.scrollView}>

        {/* Navigation rapide */}
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
            <Pressable 
              style={styles.menuItem}
              onPress={() => router.push('/service/plan_de_salle' as any)}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="restaurant-outline" size={32} color="#194A8D" />
              </View>
              <Text style={styles.menuItemText}>Plan de salle</Text>
            </Pressable>

            <Pressable 
              style={styles.menuItem}
              onPress={() => router.push('/cuisine/cuisine' as any)}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="fast-food-outline" size={32} color="#194A8D" />
              </View>
              <Text style={styles.menuItemText}>Cuisine</Text>
            </Pressable>

            <Pressable 
              style={styles.menuItem}
              onPress={() => router.push('/cuisine/stock' as any)}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="cube-outline" size={32} color="#194A8D" />
              </View>
              <Text style={styles.menuItemText}>Stock</Text>
            </Pressable>

            <Pressable 
              style={styles.menuItem}
              onPress={() => router.push('/manageur/gestion_menu/gestion_menu' as any)}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="list-outline" size={32} color="#194A8D" />
              </View>
              <Text style={styles.menuItemText}>Menu</Text>
            </Pressable>
          </View>
        </View>

        {/* Section d'accueil */}
        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Performance</Text>
            <View style={styles.categorySeparatorContainer}>
              <LinearGradient
                colors={['transparent', '#CAE1EF', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.categorySeparator}
              />
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statsBox}>
              <Text style={styles.statsValue}>16</Text>
              <Text style={styles.statsLabel}>Tables actives</Text>
            </View>
            
            <View style={styles.statsBox}>
              <Text style={styles.statsValue}>8</Text>
              <Text style={styles.statsLabel}>Commandes en cours</Text>
            </View>
            
            <View style={styles.statsBox}>
              <Text style={styles.statsValue}>4</Text>
              <Text style={styles.statsLabel}>En attente en cuisine</Text>
            </View>
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Mission</Text>
            <View style={styles.categorySeparatorContainer}>
              <LinearGradient
                colors={['transparent', '#CAE1EF', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.categorySeparator}
              />
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <Pressable 
                style= {styles.statsBox}
                onPress={() => router.push('/cuisine/stock' as any)}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="cube-outline" size={32} color="#194A8D" />
                </View>
                <Text style={styles.statsLabel}>Toutes les missions</Text>
            </Pressable>
            <Pressable 
                style= {styles.statsBox}
                onPress={() => router.push('/cuisine/stock' as any)}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="cube-outline" size={32} color="#194A8D" />
                </View>
                <Text style={styles.statsLabel}>Ajouter une mission</Text>
            </Pressable>
            <Pressable 
                style= {styles.statsBox}
                onPress={() => router.push('/cuisine/stock' as any)}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="cube-outline" size={32} color="#194A8D" />
                </View>
                <Text style={styles.statsLabel}>Mes mission</Text>
            </Pressable>
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
          
          <View style={styles.advancedButtonsContainer}>
            <Pressable 
              style={styles.advancedButton}
              onPress={() => console.log('Personnel')}
            >
              <Ionicons name="people-outline" size={20} color="#194A8D" />
              <Text style={styles.advancedButtonText}>Gestion du personnel</Text>
            </Pressable>
            
            <Pressable 
              style={styles.advancedButton}
              onPress={() => console.log('Réservations')}
            >
              <Ionicons name="calendar-outline" size={20} color="#194A8D" />
              <Text style={styles.advancedButtonText}>Réservations</Text>
            </Pressable>
            
            <Pressable 
              style={styles.advancedButton}
              onPress={() => console.log('Rapports')}
            >
              <Ionicons name="stats-chart-outline" size={20} color="#194A8D" />
              <Text style={styles.advancedButtonText}>Rapports financiers</Text>
            </Pressable>
            
            <Pressable 
              style={styles.advancedButton}
              onPress={() => console.log('Paramètres')}
            >
              <Ionicons name="settings-outline" size={20} color="#194A8D" />
              <Text style={styles.advancedButtonText}>Paramètres</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#194A8D',
  },
  headerSquare: {
    alignSelf: 'center',
    backgroundColor: '#CAE1EF',
    width: 200,
    height: 35,
    marginBottom: 10,
    borderRadius: 80,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        marginTop: 45,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerSquareText: {
    color: '#083F8C',
    fontWeight: 'bold',
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
    padding: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  categoryTitle: {
    fontSize: 20,
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
    height: 2,
    width: '100%',
  },
  welcomeBox: {
    padding: 15,
    backgroundColor: '#CAE1EF',
    borderRadius: 15,
  },
  welcomeText: {
    fontSize: 16,
    color: '#194A8D',
    textAlign: 'center',
    lineHeight: 22,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#CAE1EF',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuItemText: {
    color: '#194A8D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  statsBox: {
    flex: 1,
    backgroundColor: '#CAE1EF',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#194A8D',
  },
  statsLabel: {
    fontSize: 12,
    color: '#194A8D',
    textAlign: 'center',
    marginTop: 5,
  },
  advancedButtonsContainer: {
    padding: 10,
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CAE1EF',
    borderRadius: 15,
    padding: 12,
    marginBottom: 10,
  },
  advancedButtonText: {
    color: '#194A8D',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
});
