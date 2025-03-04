import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Table {
  id: number;
  numero: string;
  places: number;
  status: 'libre' | 'occupee' | 'reservee';
  position: { x: number; y: number };
}

export default function PlanDeSalle() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'plan' | 'liste'>('plan');

  const [tables, setTables] = useState<Table[]>([
    { id: 1, numero: "T1", places: 4, status: 'libre', position: { x: 10, y: 0 } },
    { id: 2, numero: "T2", places: 2, status: 'occupee', position: { x: 1, y: 0 } },
    { id: 3, numero: "T3", places: 6, status: 'reservee', position: { x: 2, y: 0 } },
    { id: 4, numero: "T4", places: 4, status: 'libre', position: { x: 0, y: 1 } },
    { id: 5, numero: "T5", places: 8, status: 'libre', position: { x: 1, y: 1 } },
    { id: 6, numero: "T6", places: 2, status: 'occupee', position: { x: 2, y: 1 } },
  ]);

  const handleTablePress = (tableId: number) => {
    router.push({
      pathname: "../commande/commande_Table",
      params: { tableId: tableId }
    });
  };

  const getNextStatus = (currentStatus: Table['status']): Table['status'] => {
    const statuses: Table['status'][] = ['libre', 'reservee', 'occupee'];
    const currentIndex = statuses.indexOf(currentStatus);
    return statuses[(currentIndex + 1) % statuses.length];
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'libre': return '#4CAF50';
      case 'occupee': return '#EFBC51'; // Changed to match commande_Table color
      case 'reservee': return '#CAE1EF'; // Changed to match commande_Table color
    }
  };

  const getStatusText = (status: Table['status']) => {
    switch (status) {
      case 'libre': return 'Libre';
      case 'occupee': return 'Occupée';
      case 'reservee': return 'Réservée';
    }
  };
  
  // Sort tables for list view
  const sortedTables = [...tables].sort((a, b) => {
    // Extract numbers from table numbers (assuming format "T1", "T2", etc.)
    const numA = parseInt(a.numero.replace(/\D/g, ''));
    const numB = parseInt(b.numero.replace(/\D/g, ''));
    return numA - numB;
  });

  const renderPlanView = () => (
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
              <MaterialIcons name="people" size={24} color="#194A8D" />
              <Text style={styles.placesText}>{table.places} places</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );

  const renderListView = () => (
    <ScrollView style={styles.listContainer}>
      {sortedTables.map((table) => (
        <TouchableOpacity
          key={table.id}
          style={[
            styles.tableListItem,
            { backgroundColor: getStatusColor(table.status) }
          ]}
          onPress={() => handleTablePress(table.id)}
        >
          <View style={styles.tableListInfo}>
            <Text style={styles.tableListNumero}>{table.numero}</Text>
            <View style={styles.tableListDetails}>
              <MaterialIcons name="people" size={18} color="#194A8D" />
              <Text style={styles.tableListPlaces}>{table.places} places</Text>
            </View>
          </View>
          <Text style={styles.tableListStatus}>{getStatusText(table.status)}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderToggleButton = (mode: 'plan' | 'liste', text: string) => (
    <Pressable
      style={[
        styles.toggleButton,
        viewMode === mode ? styles.activeToggle : {}
      ]}
      onPress={() => setViewMode(mode)}
    >
      <Text style={styles.toggleButtonText}>{text}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerSquare}>
        <Text style={styles.headerSquareText}>Plan de Salle</Text>
      </View>
      
      <View style={styles.toggleContainer}>
        {renderToggleButton('plan', 'Vue Plan')}
        {renderToggleButton('liste', 'Liste des Tables')}
      </View>

      <View style={styles.contentContainer}>
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
        
        {viewMode === 'plan' ? renderPlanView() : renderListView()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#194A8D', // Matched with commande_Table.tsx
  },
  headerSquare: {
    alignSelf: 'center',
    backgroundColor: '#CAE1EF',
    width: 200,
    height: 35,
    marginBottom: 15,
    borderRadius: 80,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        marginTop: 45,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerSquareText: {
    color: '#083F8C',
    fontWeight: 'bold',
    fontSize: 18,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  toggleButton: {
    backgroundColor: '#CAE1EF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '45%',
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#EFBC51',
  },
  toggleButtonText: {
    color: '#083F8C',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  legende: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#F3EFEF',
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
  legendeText: {
    color: '#083F8C',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F3EFEF',
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
    color: '#194A8D',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  placesText: {
    color: '#194A8D',
    fontSize: 14,
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F3EFEF',
  },
  tableListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  tableListInfo: {
    flexDirection: 'column',
  },
  tableListNumero: {
    color: '#194A8D',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tableListDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tableListPlaces: {
    color: '#194A8D',
    fontSize: 14,
    marginLeft: 4,
  },
  tableListStatus: {
    color: '#194A8D',
    fontSize: 16,
    fontWeight: '500',
  },
});