import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Button, StyleSheet , TouchableOpacity, Modal, TextInput, Alert} from 'react-native';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/app/firebase/firebaseConfig';
import { Plat, get_plats, ajout_plat } from '@/app/firebase/firebaseMenu';
import { useRestaurant } from '@/app/restaurant/SelectionContext';


export default function Menu() {
  const { currentRestaurant } = useRestaurant();
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlat, setNewPlat] = useState({
    name: '',
    category: '',
    price: '',
    });


  const fetchPlats = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!currentRestaurant) {
        setError("Aucun restaurant sélectionné");
        return;
      }
      const menuItems = await get_plats(true, currentRestaurant.id);
      setPlats(menuItems);
    } catch (err) {
      console.error('Erreur lors de la récupération des plats:', err);
      setError("Impossible de charger le menu. Veuillez vérifier votre connexion et réessayer.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPlats();
  }, []);

  const handleAddPlat = async () => {
    try {
      if (!currentRestaurant) {
        Alert.alert('Erreur', 'Aucun restaurant sélectionné');
        return;
      }

      if (!newPlat.name || !newPlat.category || !newPlat.price) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
      }

      await ajout_plat({
        name: newPlat.name,
        category: newPlat.category,
        price: Number(newPlat.price)
      }, currentRestaurant.id);

      setModalVisible(false);
      setNewPlat({ name: '', category: '', price: '' });

      const querySnapshot = await getDocs(collection(db, "menu"));
      const items = querySnapshot.docs.map((doc) => {
          const data = doc.data() as Omit<Plat, 'id'>;
          return {
              id: doc.id,
              ...data,
          };
      });
      setPlats(items)
    } catch (error) {
      console.error('Error adding dish:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le plat');
    }
  };

  const renderItem = ({ item }: { item: Plat }) => (
    <View style={styles.platItem}>
      <Text style={styles.platName}>{item.name}</Text>
      <Text style={styles.platCategory}>{item.category}</Text>
      <Text style={styles.platPrice}>{item.price}€</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Chargement du menu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Réessayer" onPress={fetchPlats} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={plats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString() || String(Math.random())}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun plat disponible</Text>
        }/>
      <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
      >
          <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Ajouter un article</Text>
              <TextInput
                  style={styles.input}
                  placeholder="Nom"
                  value={newPlat.name}
                  onChangeText={(text) => setNewPlat({...newPlat, name: text})}
              />
              <TextInput
                  style={styles.input}
                  placeholder="Quantité"
                  keyboardType="numeric"
                  value={newPlat.category}
                  onChangeText={(text) => setNewPlat({...newPlat, category: text})}
              />
              <TextInput
                  style={styles.input}
                  placeholder="Prix"
                  keyboardType="numeric"
                  value={newPlat.price}
                  onChangeText={(text) => setNewPlat({...newPlat, price: text})}
              />
              <View style={styles.modalButtons}>
                  <TouchableOpacity
                      style={[styles.button, styles.buttonClose]}
                      onPress={() => setModalVisible(false)}
                  >
                      <Text style={styles.textStyle}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                      style={[styles.button, styles.buttonSubmit]}
                      onPress={handleAddPlat}
                  >
                      <Text style={styles.textStyle}>Ajouter</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>
      <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
      >
          <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>


    </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  platItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  platName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  platCategory: {
    fontSize: 14,
    color: '#666',
  },
  platPrice: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
  },
   modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
        elevation: 5,
        marginTop: 100
    },
    input: {
        width: '100%',
        marginBottom: 15,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },
    button: {
        borderRadius: 5,
        padding: 10,
        elevation: 2,
        marginHorizontal: 10
    },
    buttonClose: {
        backgroundColor: '#FF6B6B',
    },
    buttonSubmit: {
        backgroundColor: '#4CAF50',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold'
    },
    addButton: {
        position: 'absolute',
        right: 30,
        bottom: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
    addButtonText: {
        color: 'white',
        fontSize: 30,
        fontWeight: 'bold'
    },
})