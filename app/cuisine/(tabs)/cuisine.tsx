import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Platform, Alert, ActivityIndicator } from 'react-native';
import { TicketData, PlatQuantite, listenToTicketsActifs, updateStatusPlat } from '@/app/firebase/firebaseCommandeOptimized';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import { useRestaurant } from '@/app/contexts/RestaurantContext';

const Cuisine = () => {
  const [commandes, setCommandes] = useState<TicketData[]>([]);
  
  // 🎯 Utilisation du contexte restaurant - BEAUCOUP plus simple !
  const { restaurantId: currentRestaurantId, isLoading, refreshRestaurant } = useRestaurant();
  
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../../assets/fonts/AlexBrush-Regular.ttf'),
  });

  useEffect(() => {
    if (!currentRestaurantId) return;

    // Écouter les changements en temps réel des tickets actifs
    const unsubscribe = listenToTicketsActifs(currentRestaurantId, (tickets) => {
      // Filtrer seulement les tickets avec des plats en cours de préparation
      const ticketsEnCours = tickets.filter(ticket => 
        ticket.status === 'en_attente' || 
        ticket.status === 'en_preparation' || 
        ticket.status === 'prete'
      );
      setCommandes(ticketsEnCours);
    });

    return () => unsubscribe();
  }, [currentRestaurantId]);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Chargement de la cuisine...</Text>
      </View>
    );
  }

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
      if (!currentRestaurantId) {
        Alert.alert("Erreur", "Restaurant non sélectionné");
        return;
      }

      // Get the next status based on current status
      const nextStatus = getNextStatus(currentStatus);
      console.log(`Updating dish ${platName} from ${currentStatus} to ${nextStatus}`);

      // Use the optimized API to update the dish status
      await updateStatusPlat(tableId, currentRestaurantId, platName, nextStatus);
      
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
      <View style={styles.headerSquare}>
        <Text style={styles.headerSquareText}>Cuisine</Text>
        <Pressable 
          style={styles.refreshButton}
          onPress={refreshRestaurant}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#083F8C" />
          ) : (
            <MaterialIcons name="refresh" size={20} color="#083F8C" />
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Indicateur de statut du restaurant avec contexte */}
        <View style={styles.restaurantStatus}>
          <MaterialIcons 
            name="restaurant" 
            size={16} 
            color={currentRestaurantId ? "#4CAF50" : "#FF5722"} 
          />
          <Text style={[
            styles.restaurantStatusText,
            { color: currentRestaurantId ? "#4CAF50" : "#FF5722" }
          ]}>
            {isLoading 
              ? "Chargement restaurant..." 
              : currentRestaurantId 
                ? `Restaurant: ${currentRestaurantId}` 
                : "Aucun restaurant sélectionné"
            }
          </Text>
          {isLoading && (
            <ActivityIndicator size="small" color="#4CAF50" />
          )}
        </View>

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
            {renderPlats(commandes.flatMap(c => c.plats), 'pret')}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#CAE1EF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
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
    flexDirection: 'row',
    position: 'relative',
    ...Platform.select({
      ios: {
        marginTop: 45,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  refreshButton: {
    position: 'absolute',
    right: 10,
    padding: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerSquareText: {
    color: '#083F8C',
    fontWeight: 'bold',
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  restaurantStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  restaurantStatusText: {
    fontSize: 14,
    fontWeight: '600',
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

