import React from 'react';
import { View, StyleSheet } from 'react-native';
import MissionProgressTester from '../components/MissionProgressTester';

const MissionTestPage = () => {
  return (
    <View style={styles.container}>
      <MissionProgressTester />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#194A8D',
  },
});

export default MissionTestPage;
