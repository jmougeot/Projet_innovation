import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Table {
  id: number;
  numero: string;
  places: number;
  status: 'libre' | 'occupee' | 'reservee';
  position: { x: number; y: number };
}

export default function PlanDeSalle() {
  const [tables, setTables] = useState<Table[]>([
    { id: 1, numero: "T1", places: 4, status: 'libre', position: { x: 10, y: 0 } },
    { id: 2, numero: "T2", places: 2, status: 'occupee', position: { x: 1, y: 0 } },
    { id: 3, numero: "T3", places: 6, status: 'reservee', position: { x: 2, y: 0 } },
    { id: 4, numero: "T4", places: 4, status: 'libre', position: { x: 0, y: 1 } },
    { id: 5, numero: "T5", places: 8, status: 'libre', position: { x: 1, y: 1 } },
    { id: 6, numero: "T6", places: 2, status: 'occupee', position: { x: 2, y: 1 } },
  ]);

  const handleTablePress = (tableId: number) => {
    setTables(tables.map(table => 
      table.id === tableId 
        ? { ...table, status: getNextStatus(table.status) }
        : table
    ));
  };

  const getNextStatus = (currentStatus: Table['status']): Table['status'] => {
    const statuses: Table['status'][] = ['libre', 'reservee', 'occupee'];
    const currentIndex = statuses.indexOf(currentStatus);
    return statuses[(currentIndex + 1) % statuses.length];
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'libre': return '#4CAF50';
      case 'occupee': return '#f44336';
      case 'reservee': return '#FFC107';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plan de Salle</Text>
        <View style={styles.legende}>
          <View style={styles.legendeItem}>
            <View style={[styles.legendeCarre, { backgroundColor: '#4CAF50' }]} />
            <Text>Libre</Text>
          </View>
          <View style={styles.legendeItem}>
            <View style={[styles.legendeCarre, { backgroundColor: '#FFC107' }]} />
            <Text>Réservée</Text>
          </View>
          <View style={styles.legendeItem}>
            <View style={[styles.legendeCarre, { backgroundColor: '#f44336' }]} />
            <Text>Occupée</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal={true} style={styles.scrollContainer}>
        <ScrollView>
          <View style={styles.planContainer}>
            {tables.map((table) => (
              <TouchableOpacity
                key={table.id}
                style={[
                  styles.table,
                  { 
                    backgroundColor: getStatusColor(table.status),
                    transform: [
                      { translateX: table.position.x * 140 },
                      { translateY: table.position.y * 140 }
                    ]
                  }
                ]}
                onPress={() => handleTablePress(table.id)}
              >
                <Text style={styles.tableNumero}>{table.numero}</Text>
                <MaterialIcons name="people" size={24} color="white" />
                <Text style={styles.placesText}>{table.places} places</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  legende: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  legendeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendeCarre: {
    width: 16,
    height: 16,
    marginRight: 8,
    borderRadius: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  planContainer: {
    position: 'relative',
    width: 1000,
    height: 800,
    padding: 20,
  },
  table: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tableNumero: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  placesText: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
  }
});