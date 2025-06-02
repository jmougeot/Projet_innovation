import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRealtimeTables } from '../firebase/firebaseRealtimeCache';

// Real-time Table Status Component
export const RealtimeTableStatus = () => {
  const { tables, availableTables, isLoading } = useRealtimeTables();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>📡 Chargement tables temps réel...</Text>
      </View>
    );
  }

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'libre': return '#4CAF50';
      case 'occupée': return '#ff4444';
      case 'reservée': return '#ff9500';
      case 'sale': return '#9e9e9e';
      default: return '#ccc';
    }
  };

  const getTableStatusIcon = (status: string) => {
    switch (status) {
      case 'libre': return '✅';
      case 'occupée': return '👥';
      case 'reservée': return '📅';
      case 'sale': return '🧹';
      default: return '❓';
    }
  };

  const handleTableAction = (tableId: number, currentStatus: string) => {
    console.log(`Table ${tableId} action - Current status: ${currentStatus}`);
    // Implementation for table status change
  };

  const getTableStats = () => {
    const libre = tables.filter(t => t.status === 'libre').length;
    const occupée = tables.filter(t => t.status === 'occupée').length;
    const reservée = tables.filter(t => t.status === 'reservée').length;
    const sale = tables.filter(t => t.status === 'sale').length;
    
    return { libre, occupée, reservée, sale };
  };

  const stats = getTableStats();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🪑 Tables Temps Réel</Text>
      
      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.libre}</Text>
          <Text style={styles.statLabel}>✅ Libres</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#ff4444' }]}>{stats.occupée}</Text>
          <Text style={styles.statLabel}>👥 Occupées</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#ff9500' }]}>{stats.reservée}</Text>
          <Text style={styles.statLabel}>📅 Réservées</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#9e9e9e' }]}>{stats.sale}</Text>
          <Text style={styles.statLabel}>🧹 À nettoyer</Text>
        </View>
      </View>

      {/* Available Tables Highlight */}
      {availableTables.length > 0 && (
        <View style={styles.availableSection}>
          <Text style={styles.availableTitle}>
            ✅ Tables Disponibles ({availableTables.length})
          </Text>
          <View style={styles.availableList}>
            {availableTables.map((table) => (
              <View key={table.id} style={styles.availableTable}>
                <Text style={styles.availableTableText}>
                  Table {table.numero} ({table.places} places)
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* All Tables Grid */}
      <ScrollView style={styles.tablesList}>
        <View style={styles.tablesGrid}>
          {tables
            .sort((a, b) => a.numero - b.numero)
            .map((table) => (
            <TouchableOpacity
              key={table.id}
              style={[
                styles.tableCard,
                { borderColor: getTableStatusColor(table.status) }
              ]}
              onPress={() => handleTableAction(table.id, table.status)}
            >
              <View style={styles.tableHeader}>
                <Text style={styles.tableNumber}>Table {table.numero}</Text>
                <Text style={styles.tableIcon}>
                  {getTableStatusIcon(table.status)}
                </Text>
              </View>
              
              <Text style={[
                styles.tableStatus,
                { color: getTableStatusColor(table.status) }
              ]}>
                {table.status.toUpperCase()}
              </Text>
              
              <Text style={styles.tablePlaces}>
                👥 {table.places} places
              </Text>
              
              {/* Status indicator bar */}
              <View style={styles.statusBar}>
                <View 
                  style={[
                    styles.statusBarFill,
                    { backgroundColor: getTableStatusColor(table.status) }
                  ]} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <Text style={styles.footer}>
        📡 Statuts mis à jour en temps réel • Total: {tables.length} tables
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
    marginTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  availableSection: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  availableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  availableList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  availableTable: {
    backgroundColor: '#c8e6c9',
    padding: 8,
    borderRadius: 15,
    margin: 2,
  },
  availableTableText: {
    fontSize: 12,
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  tablesList: {
    flex: 1,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tableCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tableIcon: {
    fontSize: 20,
  },
  tableStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tablePlaces: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statusBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  statusBarFill: {
    height: '100%',
    width: '100%',
    borderRadius: 2,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
});

export default RealtimeTableStatus;
