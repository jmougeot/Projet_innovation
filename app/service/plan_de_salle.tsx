import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Table {
  id: number;
  numero: string;
  places: number;
  status: 'libre' | 'occupee';
  position: { x: number; y: number };
}

export default function PlanDeSalle() {
  const [tables, setTables] = useState<Table[]>([
    { id: 1, numero: "T1", places: 4, status: 'libre', position: { x: 0, y: 0 } },
    { id: 2, numero: "T2", places: 2, status: 'occupee', position: { x: 1, y: 0 } },
    { id: 3, numero: "T3", places: 6, status: 'libre', position: { x: 0, y: 1 } },
    { id: 4, numero: "T4", places: 4, status: 'libre', position: { x: 1, y: 1 } },
  ]);

  const handleTablePress = (tableId: number) => {
    setTables(tables.map(table => 
      table.id === tableId 
        ? { ...table, status: table.status === 'libre' ? 'occupee' : 'libre' }
        : table
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plan de Salle</Text>
        <View style={styles.legende}>
          <View style={styles.legendeItem}>
            <View style={[styles.legendeCarre, { backgroundColor: '#4CAF50' }]} />
            <Text>Libre</Text>
          </View>
          <View style={styles.legendeItem}>
            <View style={[styles.legendeCarre, { backgroundColor: '#f44336' }]} />
            <Text>Occupée</Text>
          </View>
        </View>
      </View>

      <View style={styles.planContainer}>
        {tables.map((table) => (
          <TouchableOpacity
            key={table.id}
            style={[
              styles.table,
              { 
                backgroundColor: table.status === 'libre' ? '#4CAF50' : '#f44336',
                left: table.position.x * 120,
                top: table.position.y * 120,
              }
            ]}
            onPress={() => handleTablePress(table.id)}
          >
            <Text style={styles.tableText}>{table.numero}</Text>
            <MaterialIcons 
              name="people" 
              size={24} 
              color="white" 
            />
            <Text style={styles.placesText}>{table.places}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  legende: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendeCarre: {
    width: 20,
    height: 20,
    marginRight: 5,
    borderRadius: 4,
  },
  planContainer: {
    padding: 20,
    minHeight: 500,
  },
  table: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tableText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placesText: {
    color: 'white',
    fontSize: 16,
  },
});