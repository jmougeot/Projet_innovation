import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { TicketData, PlatQuantite, listenToTicketsActifs, updateStatusPlat } from '@/app/firebase/firebaseCommandeOptimized';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import Reglage from '@/app/components/reglage';
import { getCuisineServiceMenuItems } from '../components/ServiceNavigation';
import { useRestaurant } from '@/app/contexts/RestaurantContext';

const Cuisine = () => {
  // Tous les hooks au début
  const [commandes, setCommandes] = useState<TicketData[]>([]);
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../../assets/fonts/AlexBrush-Regular.ttf'),
  });
  const { restaurantId: CurrentRestaurantId } = useRestaurant();

  // Variables dérivées après tous les hooks
  const cuisineMenuItems = getCuisineServiceMenuItems();

  // Function to get the next status - updated pour les nouveaux types
  const getNextStatus = (currentStatus: string): 'en_attente' | 'en_preparation' | 'pret' | 'envoye' | 'servi' => {
    switch(currentStatus.toLowerCase()) {
      case 'en attente':
      case 'en_attente':
        return 'en_preparation';
      case 'en cours':
      case 'en_preparation':
        return 'pret';
      case 'prêt':
      case 'pret':
        return 'envoye';
      case 'envoyé':
      case 'envoye':
        return 'servi';
      default:
        return 'en_attente';
    }
  };

  // Update status using the optimized API
  const customUpdateStatusPlat = async (tableId: number, platName: string, currentStatus: string) => {
    try {
      if (!CurrentRestaurantId) {
        Alert.alert("Erreur", "Restaurant non sélectionné");
        return;
      }

      // Get the next status based on current status
      const nextStatus = getNextStatus(currentStatus);
      console.log(`Updating dish ${platName} from ${currentStatus} to ${nextStatus}`);

      // Use the optimized API to update the dish status
      await updateStatusPlat(tableId, CurrentRestaurantId, platName, nextStatus);
      
      Alert.alert("Succès", `${platName} est maintenant ${nextStatus}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la mise à jour");
    }
  };

  const handleStatusUpdate = (plat: PlatQuantite) => {
    customUpdateStatusPlat(plat.tableId, plat.plat.name, plat.status);
  };

  const renderPlats = (plats: PlatQuantite[], status: string) => {
    return plats.filter(p => p.status.toLowerCase() === status.toLowerCase()).map((plat, index) => (
      <Pressable 
        key={index} 
        style={styles.platItem}
        onPress={() => handleStatusUpdate(plat)}
      >
        <View style={styles.platInfo}>
          <Text style={styles.platNom}>{plat.plat.name}</Text>
          <Text style={styles.platQuantite}>Quantité: {plat.quantite}</Text>
        </View>
        <View style={styles.tableInfo}>
          <Text style={styles.tableText}>Table {plat.tableId}</Text>
        </View>
      </Pressable>
    ));
  };

  return (
    <View style={styles.container}>
      <Reglage position={{ top: 10, right: 15 }} menuItems={cuisineMenuItems} />
      <View style={styles.headerSquare}>
        <Text style={styles.headerSquareText}>Cuisine</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Commandes prêtes</Text>
            <View style={styles.categorySeparatorContainer}>
              <LinearGradient
                colors={['transparent', '#CAE1EF', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.categorySeparator}
              />
            </View>
          </View>
          <View style={styles.content}>
            {renderPlats(commandes.flatMap(c => c.plats), 'prêt')}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Commandes en cours</Text>
            <View style={styles.categorySeparatorContainer}>
              <LinearGradient
                colors={['transparent', '#CAE1EF', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.categorySeparator}
              />
            </View>
          </View>
          <View style={styles.content}>
            {renderPlats(commandes.flatMap(c => c.plats), 'en cours')}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Commandes en attente</Text>
            <View style={styles.categorySeparatorContainer}>
              <LinearGradient
                colors={['transparent', '#CAE1EF', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.categorySeparator}
              />
            </View>
          </View>
          <View style={styles.content}>
            {renderPlats(commandes.flatMap(c => c.plats), 'en attente')}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#194A8D',
  },
  headerSquare: {
    alignSelf: 'center',
    backgroundColor: '#CAE1EF',
    width: 150,
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
  content: {
    padding: 5,
  },
  platItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#CAE1EF',
    borderRadius: 15,
  },
  platInfo: {
    flex: 1,
  },
  platNom: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#194A8D',
  },
  platQuantite: {
    fontSize: 14,
    color: '#194A8D',
  },
  tableInfo: {
    backgroundColor: '#194A8D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tableText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Cuisine;