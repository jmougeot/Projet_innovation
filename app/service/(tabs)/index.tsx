import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { collection, onSnapshot, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase/firebaseConfig';
import { CommandeData, PlatQuantite } from '@/app/firebase/firebaseCommande';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';

const Cuisine = () => {
  const [commandes, setCommandes] = useState<CommandeData[]>([]);
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../../assets/fonts/AlexBrush-Regular.ttf'),
  });

  useEffect(() => {
    // Écouter les changements en temps réel
    const commandesRef = collection(db, 'commandes');
    const q = query(commandesRef, where('status', 'in', ['en attente', 'en cours', 'prêt', 'servi']));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nouvellesCommandes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommandeData[];
      setCommandes(nouvellesCommandes);
    });

    return () => unsubscribe();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  // Function to get the next status
  const getNextStatus = (currentStatus: string): string => {
    switch(currentStatus.toLowerCase()) {
      case 'en attente':
        return 'en cours';
      case 'en cours':
        return 'prêt';
      case 'prêt':
        return 'servi';
      default:
        return currentStatus;
    }
  };

  // Custom implementation to properly update the status of a dish directly in Firestore
  const customUpdateStatusPlat = async (tableId: number, platName: string, currentStatus: string) => {
    try {
      // Find the command document that contains this dish
      const commandeToUpdate = commandes.find(commande => 
        commande.tableId === tableId && 
        commande.plats.some(plat => plat.plat.name === platName && plat.status === currentStatus)
      );

      if (!commandeToUpdate) {
        Alert.alert("Erreur", "Commande introuvable");
        return;
      }

      // Get the next status based on current status
      const nextStatus = getNextStatus(currentStatus);
      console.log(`Updating dish ${platName} from ${currentStatus} to ${nextStatus}`);

      // Get a reference to the document
      const docRef = doc(db, "commandes", commandeToUpdate.id);
      
      // Get the latest document data
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        Alert.alert("Erreur", "Document introuvable");
        return;
      }
      
      const commandeData = docSnap.data() as CommandeData;
      
      // Find the index of the dish to update
      const updatedPlats = [...commandeData.plats];
      const platIndex = updatedPlats.findIndex(
        p => p.plat.name === platName && p.status === currentStatus
      );
      
      if (platIndex === -1) {
        Alert.alert("Erreur", "Plat introuvable dans la commande");
        return;
      }
      
      // Update the status
      updatedPlats[platIndex] = {
        ...updatedPlats[platIndex],
        status: nextStatus
      };
      
      // Update the document in Firestore
      await updateDoc(docRef, {
        plats: updatedPlats
      });
      
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