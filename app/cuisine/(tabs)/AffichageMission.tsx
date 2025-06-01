import React from 'react';
import { View, StyleSheet } from 'react-native';
import UserMissionsPage from '../../mission/pages/UserMissionsPage';

export default function AffichageMission() {
  return (
    <View style={styles.container}>
      <UserMissionsPage />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#194A8D',
  }
});