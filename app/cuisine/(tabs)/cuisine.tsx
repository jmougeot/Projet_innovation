import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/app/firebase/firebaseConfig';
import { CommandeData, PlatQuantite,updateStatusPlat } from '@/app/firebase/firebaseCommande';
import { globalStyles } from '../../styles/globalStyles';

const Cuisine = () => {
  const [commandes, setCommandes] = useState<CommandeData[]>([]);

  useEffect(() => {
    // Écouter les changements en temps réel
    const commandesRef = collection(db, 'commandes');
    const q = query(commandesRef, where('status', 'in', ['en attente', 'en cours']));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nouvellesCommandes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommandeData[];
      setCommandes(nouvellesCommandes);
    });

    return () => unsubscribe();
  }, []);

  const renderPlats = (plats: PlatQuantite[], status: string) => {
    return plats.filter(p => p.status === status).map((plat, index) => (
      <Pressable key={index} style={styles.platItem}
      onPress={() => updateStatusPlat(plat.tableId, plat.plat.name, status)}
      onLongPress={() => updateStatusPlat(plat.tableId, plat.plat.name, status)}>
        <Text style={styles.platNom}>{plat.plat.name} x{plat.quantite}</Text>
        <Text style={styles.platTable}>Table {plat.tableId}</Text>
      </Pressable>
    ));
  };

  return (
    <ScrollView>

      <View style={styles.header}>
        <Text style={globalStyles.h2}>Commandes prêtes</Text>
      </View>
      <View style={styles.content}>
        {renderPlats(commandes.flatMap(c => c.plats), 'prêt')}
      </View>

      <View style={styles.header}>
        <Text style={globalStyles.h2}>Commandes en cours</Text>
      </View>
      <View style={styles.content}>
        {renderPlats(commandes.flatMap(c => c.plats), 'en cours')}
      </View>

      <View style={styles.header}>
        <Text style={globalStyles.h2}>Commandes en attente</Text>
      </View>
      <View style={styles.content}>
        {renderPlats(commandes.flatMap(c => c.plats), 'en attente')}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 10,
  },
  platItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    marginVertical: 5,
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 2,
  },
  platNom: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  platTable: {
    fontSize: 14,
    color: '#666',
  }
});

export default Cuisine;

