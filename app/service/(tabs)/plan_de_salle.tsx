import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Table, getTables, updateTableStatus, initializeDefaultTables } from '@/app/firebase/firebaseTables';

// Match table size with change_plan.tsx
const TABLE_SIZE = 50;

export default function PlanDeSalle() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'plan' | 'liste'>('plan');
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load tables from Firebase
  useEffect(() => {
    const loadTables = async () => {
      try {
        setLoading(true);
        // Initialize with default tables if none exist
        await initializeDefaultTables();
        const tablesData = await getTables();
        setTables(tablesData);
      } catch (error) {
        console.error("Error loading tables:", error);
        alert("Erreur lors du chargement des tables");
      } finally {
        setLoading(false);
      }
    };
    
    loadTables();
  }, []);

  const handleTablePress = (tableId: number) => {
    router.push({
      pathname: "../commande/commande_Table",
      params: { tableId: tableId }
    });
  };

  // Change table status on long press
  const handleTableLongPress = async (tableId: number, currentStatus: Table['status']) => {
    try {
      const nextStatus = getNextStatus(currentStatus);
      await updateTableStatus(tableId, nextStatus);
      
      // Update local state
      setTables(prevTables => 
        prevTables.map(table => 
          table.id === tableId ? { ...table, status: nextStatus } : table
        )
      );
    } catch (error) {
      console.error("Error updating table status:", error);
      alert("Erreur lors de la modification du statut");
    }
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
    <View 
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#F3EFEF',
      }}
    >
      <View style={styles.planContainer}>
        {tables.map((table) => (
          <TouchableOpacity
            key={table.id}
            style={[
              styles.table,
              { 
                backgroundColor: getStatusColor(table.status),
                // Use direct positioning to match change_plan.tsx
                left: table.position.x,
                top: table.position.y,
              }
            ]}
            onPress={() => handleTablePress(table.id)}
            onLongPress={() => handleTableLongPress(table.id, table.status)}
            delayLongPress={500}
          >
            <Text style={styles.tableNumero}>{table.numero}</Text>
            <MaterialIcons name="people" size={24} color="#194A8D" />
            <Text style={styles.placesText}>{table.places} places</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
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
          onLongPress={() => handleTableLongPress(table.id, table.status)}
          delayLongPress={500}
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
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#194A8D" />
            <Text style={styles.loadingText}>Chargement des tables...</Text>
          </View>
        ) : (
          viewMode === 'plan' ? renderPlanView() : renderListView()
        )}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Appui long pour changer le statut</Text>
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
    width: '100%',
    height: '100%',
    padding: 20,
  },
  table: {
    position: 'absolute',
    width: TABLE_SIZE,
    height: TABLE_SIZE,
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
    fontSize: 16,  // Reduced font size to match smaller table
    fontWeight: 'bold',
    marginBottom: 2,
  },
  placesText: {
    color: '#194A8D',
    fontSize: 12,  // Reduced font size
    marginTop: 2,
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
  footer: {
    padding: 10,
    alignItems: 'center',
  },
  footerText: {
    color: '#CAE1EF',
    fontSize: 14,
    fontStyle: 'italic',
  },
});