import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Table, getTables, updateTableStatus, initializeDefaultTables } from '@/app/firebase/firebaseTables';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/app/components/Header';
import { 
  TableShapeRenderer, 
  getStatusColor, 
  getStatusText, 
  getNextStatus
} from '../components/Table';
import { WorkspaceContainer, useWorkspaceSize } from '../components/Workspace';

export default function PlanDeSalle() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'plan' | 'liste'>('plan');
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Utilisation du hook pour les dimensions adaptatives
  const { size: workspaceSize } = useWorkspaceSize();
  
  // Proportions relatives pour les dimensions des tables (même système que map_settings.tsx)
  const TABLE_SIZE_RATIO = 0.08; // 8% de la taille du workspace
  const tableSize = workspaceSize * TABLE_SIZE_RATIO;

  // Fonction utilitaire pour dénormaliser les positions (même logique que map_settings.tsx)
  const denormalizePosition = (normalizedPosition: { x: number, y: number }, workspaceSize: number) => {
    return {
      x: normalizedPosition.x * workspaceSize,
      y: normalizedPosition.y * workspaceSize
    };
  };

  // Fonction pour déterminer si une position est normalisée (0-1) ou absolue
  const isNormalizedPosition = (position: { x: number, y: number }) => {
    return position.x <= 1 && position.y <= 1 && position.x >= 0 && position.y >= 0;
  };

  // Charger les tables au démarrage
  useEffect(() => {
    const loadTables = async () => {
      try {
        setLoading(true);
        await initializeDefaultTables();
        const tablesData = await getTables();
        setTables(tablesData);
      } catch (error) {
        console.error("Erreur lors du chargement des tables:", error);
        alert("Erreur lors du chargement des tables");
      } finally {
        setLoading(false);
      }
    };
    
    loadTables();
  }, []);

  const handleTablePress = (tableId: number, tablenumber: string) => {
    router.push({
      pathname: "../commande/commande_Table",
      params: { tableId: tableId, tablenumber: tablenumber }
    });
  };

  // Changer le statut de la table (appui long)
  const handleTableLongPress = async (tableId: number, currentStatus: Table['status']) => {
    try {
      const nextStatus = getNextStatus(currentStatus);
      await updateTableStatus(tableId, nextStatus);
      
      setTables(prevTables => 
        prevTables.map(table => 
          table.id === tableId ? { ...table, status: nextStatus } : table
        )
      );
    } catch (error) {
      console.error("Erreur lors de la modification du statut:", error);
      alert("Erreur lors de la modification du statut");
    }
  };

  // Trier les tables par numéro pour la vue liste
  const sortedTables = [...tables].sort((a, b) => {
    const numA = parseInt(a.numero.replace(/\D/g, ''));
    const numB = parseInt(b.numero.replace(/\D/g, ''));
    return numA - numB;
  });

  // Vue plan avec workspace
  const renderPlanView = () => (
    <WorkspaceContainer style={{ flex: 1 }}>
      {tables.map((table) => {
        // Déterminer la position finale à utiliser
        let finalPosition = { x: table.position.x, y: table.position.y };
        
        // Si la position est normalisée (0-1), la dénormaliser
        if (isNormalizedPosition(table.position)) {
          finalPosition = denormalizePosition(table.position, workspaceSize);
        }
        // Sinon, utiliser la position absolue directement (rétrocompatibilité)

        return (
          <TouchableOpacity
            key={table.id}
            style={[styles.tableContainer, { 
              left: finalPosition.x,
              top: finalPosition.y,
            }]}
            onPress={() => handleTablePress(table.id, table.numero)}  
            onLongPress={() => handleTableLongPress(table.id, table.status)}
            delayLongPress={500}
            activeOpacity={0.8}
          >
            <TableShapeRenderer
              table={table}
              size={tableSize}
              backgroundColor={getStatusColor(table.status)}
              textColor="#194A8D"
              showText={true}
            />
          </TouchableOpacity>
        );
      })}
    </WorkspaceContainer>
  );

  // Vue liste des tables
  const renderListView = () => (
    <ScrollView style={styles.listContainer}>
      {sortedTables.map((table) => (
        <TouchableOpacity
          key={table.id}
          style={[styles.tableListItem, { backgroundColor: getStatusColor(table.status) }]}
          onPress={() => handleTablePress(table.id, table.numero)}
          onLongPress={() => handleTableLongPress(table.id, table.status)}
          delayLongPress={500}
          activeOpacity={0.8}
        >
          <View style={styles.tableListInfo}>
            <View style={styles.tableListLeft}>
              <TableShapeRenderer
                table={table}
                size={tableSize * 0.5} // 50% de la taille normale pour la vue liste
                backgroundColor={getStatusColor(table.status)}
                textColor="#194A8D"
                showText={true}
              />
            </View>
            <View style={styles.tableListDetails}>
              <Text style={styles.tableListNumero}>{table.numero}</Text>
              <View style={styles.tableListMeta}>
                <MaterialIcons name="people" size={18} color="#194A8D" />
                <Text style={styles.tableListPlaces}>{table.places} places</Text>
                <Text style={styles.tableListShape}>
                  • {table.position.shape || 'rond'}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.tableListStatus}>{getStatusText(table.status)}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Boutons de basculement vue plan/liste
  const renderToggleButton = (mode: 'plan' | 'liste', text: string) => (
    <Pressable
      style={[styles.toggleButton, viewMode === mode && styles.activeToggle]}
      onPress={() => setViewMode(mode)}
    >
      <Text style={styles.toggleButtonText}>{text}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Plan de Salle" 
        showBackButton={true}
        backgroundColor="#194A8D"
        textColor="#FFFFFF"
        useHeadComponent={true}
        customBackRoute="/service"
      />
      
      <View style={styles.contentWrapper}>
        <View style={styles.toggleContainer}>
          {renderToggleButton('plan', 'Vue Plan')}
          {renderToggleButton('liste', 'Liste des Tables')}
        </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#194A8D',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    margin: 10,
    borderRadius: 20,
    padding: 15,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
  },
  toggleButton: {
    backgroundColor: '#CAE1EF',
    paddingVertical: 10,
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
    fontSize: 16,
  },
  legende: {
    flexDirection: 'row',
    justifyContent: 'center',        // Centre les éléments horizontalement
    alignItems: 'center',            // Centre les éléments verticalement
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  legendeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendeCarre: {
    width: 15,
    height: 15,
    borderRadius: 3,
    marginRight: 5,
  },
  legendeText: {
    color: '#194A8D',
    fontSize: 12,
    fontWeight: '500',
  },
  tableContainer: {
    position: 'absolute',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tableListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 8,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tableListInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tableListLeft: {
    marginRight: 15,
  },
  tableListDetails: {
    flex: 1,
  },
  tableListNumero: {
    color: '#194A8D',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tableListMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tableListPlaces: {
    color: '#194A8D',
    fontSize: 14,
    marginLeft: 6,
    marginRight: 8,
  },
  tableListShape: {
    color: '#194A8D',
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  tableListStatus: {
    color: '#194A8D',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 15,
    color: '#194A8D',
    fontSize: 16,
    fontWeight: '500',
  },
});