import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRealtimeStock } from '../firebase/firebaseRealtimeCache';

// Real-time Stock Monitor Component
export const RealtimeStockMonitor = () => {
  const { stockItems, lowStockItems, isLoading } = useRealtimeStock();

  React.useEffect(() => {
    // Alert for low stock items
    if (lowStockItems.length > 0) {
      const lowStockNames = lowStockItems.map(item => item.name).join(', ');
      Alert.alert(
        '⚠️ Stock Faible',
        `Attention: ${lowStockNames}`,
        [{ text: 'OK' }]
      );
    }
  }, [lowStockItems]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>📡 Chargement stock temps réel...</Text>
      </View>
    );
  }

  const getStockStatusColor = (item: any) => {
    if (item.minLevel && item.quantity <= item.minLevel) {
      return '#ff4444'; // Red for low stock
    }
    if (item.minLevel && item.quantity <= item.minLevel * 2) {
      return '#ff9500'; // Orange for warning
    }
    return '#4CAF50'; // Green for good stock
  };

  const getStockStatusText = (item: any) => {
    if (item.minLevel && item.quantity <= item.minLevel) {
      return '🔴 Stock Critique';
    }
    if (item.minLevel && item.quantity <= item.minLevel * 2) {
      return '🟡 Stock Faible';
    }
    return '🟢 Stock OK';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Stock Temps Réel</Text>
      
      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <View style={styles.alertSection}>
          <Text style={styles.alertTitle}>⚠️ Stock Critique ({lowStockItems.length})</Text>
          {lowStockItems.map((item) => (
            <Text key={item.id} style={styles.alertItem}>
              • {item.name}: {item.quantity} {item.unit || 'unités'}
            </Text>
          ))}
        </View>
      )}

      {/* All Stock Items */}
      <ScrollView style={styles.stockList}>
        {stockItems.map((item) => (
          <View key={item.id} style={styles.stockCard}>
            <View style={styles.stockHeader}>
              <Text style={styles.stockName}>{item.name}</Text>
              <Text style={[styles.stockStatus, { color: getStockStatusColor(item) }]}>
                {getStockStatusText(item)}
              </Text>
            </View>
            
            <View style={styles.stockDetails}>
              <Text style={styles.stockQuantity}>
                Quantité: {item.quantity} {item.unit || 'unités'}
              </Text>
              {item.minLevel && (
                <Text style={styles.stockMinLevel}>
                  Minimum: {item.minLevel} {item.unit || 'unités'}
                </Text>
              )}
              <Text style={styles.stockType}>Type: {item.type}</Text>
              {item.lastUpdated && (
                <Text style={styles.stockUpdated}>
                  Mis à jour: {item.lastUpdated.toLocaleString()}
                </Text>
              )}
            </View>
            
            {/* Stock Level Bar */}
            <View style={styles.stockBar}>
              <View 
                style={[
                  styles.stockBarFill, 
                  { 
                    width: item.minLevel 
                      ? `${Math.min(100, (item.quantity / (item.minLevel * 3)) * 100)}%`
                      : '100%',
                    backgroundColor: getStockStatusColor(item)
                  }
                ]} 
              />
            </View>
          </View>
        ))}
      </ScrollView>
      
      <Text style={styles.footer}>
        📡 Données mises à jour en temps réel
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
  alertSection: {
    backgroundColor: '#ffe6e6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#cc0000',
    marginBottom: 8,
  },
  alertItem: {
    fontSize: 14,
    color: '#cc0000',
    marginVertical: 2,
  },
  stockList: {
    flex: 1,
  },
  stockCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  stockStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  stockDetails: {
    marginBottom: 10,
  },
  stockQuantity: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 2,
  },
  stockMinLevel: {
    fontSize: 12,
    color: '#666',
    marginVertical: 1,
  },
  stockType: {
    fontSize: 12,
    color: '#666',
    marginVertical: 1,
  },
  stockUpdated: {
    fontSize: 10,
    color: '#999',
    marginVertical: 1,
  },
  stockBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
});

export default RealtimeStockMonitor;
