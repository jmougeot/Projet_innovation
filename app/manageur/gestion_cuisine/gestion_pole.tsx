import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Head from '@/app/components/Head';

function GestionPole() {
  return (
    <View style={styles.container}>
      <Head title="Gestion des pôles de cuisine" />
      <View style={styles.content}>
        <Text style={styles.title}>Gestion des pôles de cuisine</Text>
        <Text style={styles.description}>Cette page est en cours de développement.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#194A8D',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EFBC51',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  }
});

// Export par défaut pour Expo Router
export default GestionPole;