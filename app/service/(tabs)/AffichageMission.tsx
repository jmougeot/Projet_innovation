import React from 'react';
import { View, StyleSheet } from 'react-native';
import UserMissionsPage from '../../mission/pages/UserMissionsPage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Head from '@/app/components/Head';
import Reglage from '@/app/components/reglage';
import { getMissionMenuItems } from '../components/ServiceNavigation';

export default function AffichageMission() {
  const customMenuItems = getMissionMenuItems();

  return (
    <SafeAreaView style={styles.container}>
      <Reglage position={{ top: 0, right: 15 }} menuItems={customMenuItems} />
      
      <Head title="Missions Service" />
      
      <View style={styles.contentContainer}>
        <UserMissionsPage />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#194A8D',
    padding: 10,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    overflow: 'hidden',
  }
});