import { useState, useEffect } from 'react';
import { View,Text, TouchableOpacity, StyleSheet, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Table, getTables, updateTableStatus, initializeDefaultTables } from '@/app/firebase/firebaseTables';
import TableViewBase, { 
  TABLE_SIZE, 
  getStatusColor, 
  getStatusText, 
  getNextStatus 
} from '../components/TableViewBase';
import TableShapeRenderer from '../../components/TableShapeRenderer';

export default function PlanDeSalle() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'plan' | 'liste'>('plan');
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const customMenuItems = [
    {
      label: 'Profil',
      onPress: () => {}},
    {
      label: 'Paramètres',
      onPress: () => {
        // Open settings
      }
    },
    {
      label: 'Déconnexion',
      onPress: () => {
        // Logout logic
      },
      isLogout: true
    },
    {
      label: 'Modifier le plan',
      onPress: () => {router.push('../commande/map_settings');}
    },
  ];

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

  const handleTablePress = (tableId: number, tablenumber : string) => {
    router.push({
      pathname: "../commande/commande_Table",
      params: { tableId: tableId , tablenumber: tablenumber }
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
            onPress={() => handleTablePress(table.id, table.numero)}  
            onLongPress={() => handleTableLongPress(table.id, table.status)}
            delayLongPress={500}
          >
            <TableShapeRenderer
              table={table}
              size={TABLE_SIZE}
              showText={true}
              textColor="#194A8D"
            />
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
          onPress={() => handleTablePress(table.id, table.numero)}
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

  const renderContent = () => (
    <>
      <View style={styles.toggleContainer}>
        {renderToggleButton('plan', 'Vue Plan')}
        {renderToggleButton('liste', 'Liste des Tables')}
      </View>
      {viewMode === 'plan' ? renderPlanView() : renderListView()}
    </>
  );

  return (
    <TableViewBase
      title="Plan de Salle"
      loading={loading}
      tables={tables}
      customMenuItems={customMenuItems}
    >
      {renderContent()}
    </TableViewBase>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingTop: 10,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  placesText: {
    color: '#194A8D',
    fontSize: 12,
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
});