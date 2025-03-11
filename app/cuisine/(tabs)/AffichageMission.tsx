import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export default function AffichageMission() {
  return (
    <View style={styles.container}>
        <Text>Gestion des Missions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
});