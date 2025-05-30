import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text,
  Animated, 
  PanResponder,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  LayoutChangeEvent
} from 'react-native';
import { useFonts } from 'expo-font';
import { Table, getTables, updateTables } from '@/app/firebase/firebaseTables';
import { MaterialIcons } from '@expo/vector-icons';

// Table size in pixels
const TABLE_SIZE = 50;

// Simplified animation interface
interface TableAnimation {
  pan: Animated.ValueXY;
  responder: any;
}

export default function ChangePlan() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modified, setModified] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  
  // Simplified animations ref
  const animationsRef = useRef<{[key: string]: TableAnimation}>({});
  
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../../assets/fonts/AlexBrush-Regular.ttf'),
  });

  // Handle layout changes to get container dimensions
  const handleLayoutChange = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerDimensions({ width, height });
  };

  // Create a PanResponder for a specific table
  const createTablePanResponder = useCallback((tableId: number) => {
    const pan = new Animated.ValueXY();
    
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        // Find current table from tables array to get fresh position
        const currentTable = tables.find(t => t.id === tableId);
        if (!currentTable) return;
        
        // Calculate new position with simpler logic
        const maxX = containerDimensions.width 
        const maxY = containerDimensions.height
        
        // Calculate new position with direct deltas
        let newX = currentTable.position.x + gestureState.dx;
        let newY = currentTable.position.y + gestureState.dy;

        // Debug position values
        console.log(`Table ${tableId} new position: (${newX}, ${newY})`);
        
        // Update table position
        setTables(prev => 
          prev.map(t => t.id === tableId 
            ? { ...t, position: { x: newX, y: newY } } 
            : t)
        );
        
        // Mark as modified and reset animation
        setModified(true);
        pan.setValue({ x: 0, y: 0 });
      }
    });
    
    return { pan, responder };
  }, [containerDimensions, tables]);  // Add tables to dependencies

  // Initialize animations when tables or dimensions change
  useEffect(() => {
    tables.forEach(table => {
      if (!animationsRef.current[table.id]) {
        animationsRef.current[table.id] = createTablePanResponder(table.id);  // Pass just the ID
      }
    });
  }, [tables, containerDimensions, createTablePanResponder]);

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
    
    const newTable: Table = {
      id: newId,
      numero: `${tables.length + 1}`,
      places: 2,
      status: 'libre',
      position: { x: 3.5, y: 3.5 }
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
          Faites glisser les tables pour les repositionner
        </Text>

        <View 
          style={styles.floorPlanContainer}
          onLayout={handleLayoutChange}
        >
          {tables.map((table) => {
            const animation = animationsRef.current[table.id];
            
            if (!animation) return null;
            
            // Calculate base position in pixels - use direct values
            const baseX = Math.round(table.position.x );
            const baseY = Math.round(table.position.y);
            
            return (
              <Animated.View
                key={table.id}
                style={[
                  styles.tableItem,
                  {
                    backgroundColor: getStatusColor(table.status),
                    // Use left/top instead of transform for more reliable positioning
                    left: Animated.add(new Animated.Value(baseX), animation.pan.x),
                    top: Animated.add(new Animated.Value(baseY), animation.pan.y)
                  }
                ]}
                {...animation.responder.panHandlers}
              >
                <Text style={styles.tableNumber}>{table.numero}</Text>
                <Text style={styles.placesText}>{table.places} places</Text>
              </Animated.View>
            );
          })}
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
  },
  tableItem: {
    position: 'absolute', // Using absolute positioning
    width: TABLE_SIZE,
    height: TABLE_SIZE,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)', // Remplace les propriétés shadow* dépréciées
    zIndex: 1,
  },
  tableNumber: {
    color: '#194A8D',
    fontSize: 16,  // Reduced from 20
    fontWeight: 'bold',
  },
  placesText: {
    color: '#194A8D',
    fontSize: 12,  // Reduced from 14
    marginTop: 3,
  },
  instructionText: {
    textAlign: 'center',
    color: '#194A8D',
    marginVertical: 8,
    fontStyle: 'italic',
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#CAE1EF',
    paddingVertical: 10,  // Reduced from 12
    paddingHorizontal: 16, // Reduced from 20
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    elevation: 3,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.2)', // Remplace les propriétés shadow* dépréciées
  },
  saveButtonText: {
    color: '#194A8D',
    fontWeight: 'bold',
    fontSize: 14,  // Reduced from 16
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
    paddingVertical: 8,  // Reduced from 10
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#F3EFEF',
  },
  legendeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendeCarre: {
    width: 12,  // Reduced from 16
    height: 12,  // Reduced from 16
    marginRight: 6,
    borderRadius: 3,
  },
  legendeText: {
    color: '#083F8C',
    fontSize: 12,  // Added smaller font
  },
  addButton: {
    position: 'absolute',
    right: 20,  // Reduced from 30
    bottom: 20,  // Reduced from 30
    backgroundColor: '#194A8D',
    width: 50,  // Reduced from 60
    height: 50,  // Reduced from 60
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.3)', // Remplace les propriétés shadow* dépréciées
    zIndex: 10,
  },
});