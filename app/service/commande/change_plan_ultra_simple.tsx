import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  LayoutChangeEvent,
  Pressable
} from 'react-native';
import { useFonts } from 'expo-font';
import { Table, getTables, updateTables } from '@/app/firebase/firebaseTables';
import { MaterialIcons } from '@expo/vector-icons';

// Table size in pixels
const TABLE_SIZE = 50;

export default function ChangePlan() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modified, setModified] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../../assets/fonts/AlexBrush-Regular.ttf'),
  });

  // Handle layout changes to get container dimensions
  const handleLayoutChange = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerDimensions({ width, height });
  };

  // Load tables from Firebase
  useEffect(() => {
    const loadTables = async () => {
      try {
        setLoading(true);
        const tablesData = await getTables();
        setTables(tablesData);
      } catch (error) {
        console.error("Error loading tables:", error);
        Alert.alert("Erreur", "Impossible de charger les tables");
      } finally {
        setLoading(false);
      }
    };
    
    loadTables();
  }, []);

  // Handle container click for moving tables
  const handleContainerPress = (event: any) => {
    if (!selectedTableId) return;
    
    // Get click position relative to container
    const { locationX, locationY } = event.nativeEvent;
    
    // Calculate new position with bounds
    const padding = 10;
    const headerSpace = 90;
    const maxX = containerDimensions.width - TABLE_SIZE - padding;
    const maxY = containerDimensions.height - TABLE_SIZE - padding;
    
    let newX = Math.max(padding, Math.min(maxX, locationX - TABLE_SIZE / 2));
    let newY = Math.max(headerSpace, Math.min(maxY, locationY - TABLE_SIZE / 2));
    
    // Update table position
    setTables(prevTables => 
      prevTables.map(t => t.id === selectedTableId 
        ? { ...t, position: { x: newX, y: newY } } 
        : t)
    );
    
    setModified(true);
    setSelectedTableId(null); // Deselect after moving
  };

  // Handle table selection
  const handleTablePress = (tableId: number, event: any) => {
    event.stopPropagation();
    if (selectedTableId === tableId) {
      setSelectedTableId(null); // Deselect if already selected
    } else {
      setSelectedTableId(tableId); // Select table
    }
  };

  // Handle long press for delete
  const handleTableLongPress = (tableId: number) => {
    Alert.alert(
      "Supprimer la table",
      "Êtes-vous sûr de vouloir supprimer cette table ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            setTables(prev => prev.filter(t => t.id !== tableId));
            setSelectedTableId(null);
            setModified(true);
          }
        }
      ]
    );
  };

  // Save table positions
  const saveChanges = async () => {
    try {
      setSaving(true);
      await updateTables(tables);
      setModified(false);
      Alert.alert("Succès", "Positions des tables enregistrées avec succès");
    } catch (error) {
      console.error("Error saving table positions:", error);
      Alert.alert("Erreur", "Impossible d'enregistrer les positions");
    } finally {
      setSaving(false);
    }
  };

  // Add a new table
  const addNewTable = () => {
    const newId = Date.now();
    
    // Calculate a safe position for the new table
    const padding = 15;
    const headerSpace = 100;
    let safeX = padding;
    let safeY = headerSpace;
    
    // Simple grid placement for new tables
    const cols = Math.floor((containerDimensions.width - padding * 2) / (TABLE_SIZE + 15)) || 1;
    const tableIndex = tables.length;
    const row = Math.floor(tableIndex / cols);
    const col = tableIndex % cols;
    
    safeX = padding + col * (TABLE_SIZE + 15);
    safeY = headerSpace + row * (TABLE_SIZE + 15);
    
    // Ensure we don't exceed bounds
    if (safeX + TABLE_SIZE > containerDimensions.width - padding) {
      safeX = padding;
      safeY += TABLE_SIZE + 15;
    }
    
    const newTable: Table = {
      id: newId,
      numero: `${tables.length + 1}`,
      places: 2,
      status: 'libre',
      position: { x: safeX, y: safeY }
    };
    
    setTables(prev => [...prev, newTable]);
    setModified(true);
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#CAE1EF" />
        <Text style={styles.loadingText}>Chargement des tables...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSquare}>
        <Text style={styles.headerSquareText}>Gestion des Tables</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.instructionText}>
          {selectedTableId 
            ? "Cliquez où vous voulez placer la table sélectionnée"
            : "Cliquez sur une table pour la sélectionner • Appui long pour supprimer"}
        </Text>

        <Pressable 
          style={styles.floorPlanContainer}
          onLayout={handleLayoutChange}
          onPress={handleContainerPress}
        >
          {tables.map((table) => {
            const isSelected = selectedTableId === table.id;
            
            return (
              <Pressable
                key={`table-${table.id}`}
                style={[
                  styles.tableItem,
                  {
                    backgroundColor: getStatusColor(table.status),
                    left: table.position.x,
                    top: table.position.y,
                    opacity: isSelected ? 0.7 : 1,
                    elevation: isSelected ? 8 : 3,
                    transform: [{ scale: isSelected ? 1.1 : 1 }],
                    borderWidth: isSelected ? 3 : 0,
                    borderColor: isSelected ? '#194A8D' : 'transparent',
                    ...(Platform.OS === 'web' && { cursor: 'pointer' as any })
                  }
                ]}
                onPress={(event) => handleTablePress(table.id, event)}
                onLongPress={() => handleTableLongPress(table.id)}
              >
                <Text style={styles.tableNumber}>{table.numero}</Text>
                <Text style={styles.placesText}>{table.places} places</Text>
              </Pressable>
            );
          })}
          
          {/* Selection indicator */}
          {selectedTableId && (
            <View style={styles.selectionIndicator}>
              <Text style={styles.selectionText}>
                Table {tables.find(t => t.id === selectedTableId)?.numero} sélectionnée
              </Text>
            </View>
          )}
        </Pressable>
        
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
        
        {modified && (
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveChanges}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#194A8D" />
            ) : (
              <>
                <MaterialIcons name="save" size={24} color="#194A8D" />
                <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={addNewTable}
      >
        <MaterialIcons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const getStatusColor = (status: Table['status']) => {
  switch (status) {
    case 'libre': return '#4CAF50';
    case 'occupee': return '#EFBC51';
    case 'reservee': return '#CAE1EF';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#194A8D',
  },
  headerSquare: {
    alignSelf: 'center',
    backgroundColor: '#CAE1EF',
    width: 180,
    height: 32,
    marginBottom: 10,
    borderRadius: 80,
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
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 8,
  },
  floorPlanContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
  },
  tableItem: {
    position: 'absolute',
    width: TABLE_SIZE,
    height: TABLE_SIZE,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  tableNumber: {
    color: '#194A8D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placesText: {
    color: '#194A8D',
    fontSize: 12,
    marginTop: 3,
  },
  instructionText: {
    textAlign: 'center',
    color: '#194A8D',
    marginVertical: 8,
    fontStyle: 'italic',
    fontSize: 14,
    minHeight: 35,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#194A8D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 10,
  },
  selectionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#CAE1EF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  saveButtonText: {
    color: '#194A8D',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#CAE1EF',
    fontSize: 16,
    marginTop: 10,
  },
  legende: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#F3EFEF',
  },
  legendeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendeCarre: {
    width: 12,
    height: 12,
    marginRight: 6,
    borderRadius: 3,
  },
  legendeText: {
    color: '#083F8C',
    fontSize: 12,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#194A8D',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
  },
});
