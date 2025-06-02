import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRealtimeOrders } from '../firebase/firebaseRealtimeCache';

// Real-time Kitchen Orders Component
export const RealtimeKitchenOrders = () => {
  const { orders: pendingOrders, isLoading: pendingLoading } = useRealtimeOrders('en_attente');
  const { orders: preparingOrders, isLoading: preparingLoading } = useRealtimeOrders('en_preparation');

  if (pendingLoading || preparingLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>📡 Connexion temps réel...</Text>
      </View>
    );
  }

  const handleStartCooking = (orderId: string) => {
    console.log(`🔥 Commencer préparation: ${orderId}`);
    // Implementation to update order status
  };

  const handleFinishCooking = (orderId: string) => {
    console.log(`✅ Terminer préparation: ${orderId}`);
    // Implementation to update order status
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🍳 Cuisine - Temps Réel</Text>
      
      {/* Pending Orders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          ⏳ En Attente ({pendingOrders.length})
        </Text>
        {pendingOrders.map((order) => (
          <View key={order.id} style={[styles.orderCard, styles.pendingCard]}>
            <Text style={styles.tableText}>Table {order.tableId}</Text>
            <Text style={styles.timeText}>{new Date(order.timestamp).toLocaleTimeString()}</Text>
            
            {order.plats.map((platItem, index) => (
              <Text key={index} style={styles.dishText}>
                {platItem.quantite}x {platItem.plat.name}
              </Text>
            ))}
            
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => handleStartCooking(order.id)}
            >
              <Text style={styles.buttonText}>🔥 Commencer</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Preparing Orders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          🔥 En Préparation ({preparingOrders.length})
        </Text>
        {preparingOrders.map((order) => (
          <View key={order.id} style={[styles.orderCard, styles.preparingCard]}>
            <Text style={styles.tableText}>Table {order.tableId}</Text>
            <Text style={styles.timeText}>{new Date(order.timestamp).toLocaleTimeString()}</Text>
            
            {order.plats.map((platItem, index) => (
              <Text key={index} style={styles.dishText}>
                {platItem.quantite}x {platItem.plat.name}
              </Text>
            ))}
            
            <TouchableOpacity 
              style={styles.finishButton}
              onPress={() => handleFinishCooking(order.id)}
            >
              <Text style={styles.buttonText}>✅ Terminer</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  orderCard: {
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
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  preparingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  tableText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dishText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2,
  },
  startButton: {
    backgroundColor: '#ff9500',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RealtimeKitchenOrders;
