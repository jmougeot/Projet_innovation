import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Head from '@/app/components/Head';
import Reglage from '@/app/components/reglage';
import { Table } from '@/app/firebase/firebaseTables';

// Constantes communes
export const TABLE_SIZE = 50;
export const EDIT_TABLE_WIDTH = 80;
export const EDIT_TABLE_HEIGHT = 80;

// Interface pour les propriétés communes
export interface TableViewBaseProps {
  title: string;
  loading: boolean;
  tables: Table[];
  customMenuItems?: {
    label: string;
    onPress: () => void;
    isLogout?: boolean;
  }[];
  children: React.ReactNode;
  showLegend?: boolean;
}

// Fonctions utilitaires communes
export const getStatusColor = (status: Table['status']) => {
  switch (status) {
    case 'libre': return '#4CAF50';
    case 'occupee': return '#EFBC51';
    case 'reservee': return '#CAE1EF';
  }
};

export const getStatusText = (status: Table['status']) => {
  switch (status) {
    case 'libre': return 'Libre';
    case 'occupee': return 'Occupée';
    case 'reservee': return 'Réservée';
  }
};

export const getNextStatus = (currentStatus: Table['status']): Table['status'] => {
  const statuses: Table['status'][] = ['libre', 'reservee', 'occupee'];
  const currentIndex = statuses.indexOf(currentStatus);
  return statuses[(currentIndex + 1) % statuses.length];
};

// Composant de base pour les vues de tables
const TableViewBase: React.FC<TableViewBaseProps> = ({
  title,
  loading,
  tables,
  customMenuItems = [],
  children,
  showLegend = true
}) => {
  const renderLegend = () => (
    <View style={styles.legende}>
      <View style={styles.legendeItem}>
        <View style={[styles.legendeCarre, { backgroundColor: '#4CAF50' }]} />
        <Text style={styles.legendeText}>Libre</Text>
      </View>
      <View style={styles.legendeItem}>
        <View style={[styles.legendeCarre, { backgroundColor: '#CAE1EF' }]} />
        <Text style={styles.legendeText}>Réservée</Text>
      </View>
      <View style={styles.legendeItem}>
        <View style={[styles.legendeCarre, { backgroundColor: '#EFBC51' }]} />
        <Text style={styles.legendeText}>Occupée</Text>
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#194A8D" />
      <Text style={styles.loadingText}>Chargement des tables...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Reglage position={{ top: 0, right: 15 }} menuItems={customMenuItems} />
      <Head title={title} />
      
      <View style={styles.contentContainer}>
        {showLegend && renderLegend()}
        
        {loading ? renderLoading() : children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#194A8D',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 5,
  },
  legende: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#F3EFEF',
  },
  legendeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendeCarre: {
    width: 14,
    height: 14,
    marginRight: 6,
    borderRadius: 3,
  },
  legendeText: {
    color: '#083F8C',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3EFEF',
  },
  loadingText: {
    marginTop: 10,
    color: '#194A8D',
    fontSize: 16,
  },
});

export default TableViewBase;
