import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Button, StyleSheet } from 'react-native';
import { get_plats } from '@/app/firebase/firebaseDatabase.js';

interface Plat {
  id: string;
  name: string;
  category: string;
  price: number;
}

const MenuList: React.FC = () => {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlats = async () => {
    setLoading(true);
    setError(null);
    try {
      const menuItems = await get_plats();
      setPlats(menuItems || []);
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
    <FlatList
      data={plats}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <Text style={styles.emptyText}>Aucun plat disponible</Text>
      }
    />
  );
};

const styles = StyleSheet.create({
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
  }
});

export default MenuList;