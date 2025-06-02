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
  Pressable,
  GestureResponderEvent
} from 'react-native';
import { useFonts } from 'expo-font';
import { Table, getTables, updateTables } from '@/app/firebase/firebaseTables';
import { MaterialIcons } from '@expo/vector-icons';

// Table size in pixels
const TABLE_SIZE = 50;

interface DragState {
  isDragging: boolean;
  tableId: number | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export default function ChangePlan() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modified, setModified] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    tableId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [containerOffset, setContainerOffset] = useState({ x: 0, y: 0 });
  
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../../assets/fonts/AlexBrush-Regular.ttf'),
  });

  // Handle layout changes to get container dimensions
  const handleLayoutChange = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerDimensions({ width, height });
    
    // Get container position for web
    if (Platform.OS === 'web') {
      setTimeout(() => {
        const element = (event.target as any)?.getBoundingClientRect?.();
        if (element) {
          setContainerOffset({ x: element.left, y: element.top });
        }
      }, 0);
    }
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

  // Add global mouse event listeners for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleGlobalMouseMove = (event: MouseEvent) => {
        handleMouseMove(event);
      };

      const handleGlobalMouseUp = (event: MouseEvent) => {
        handleMouseUp(event);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [dragState.tableId]);

  // Handle start of drag (works for both touch and mouse)
  const handleDragStart = (tableId: number, clientX: number, clientY: number) => {
    setDragState({
      isDragging: false,
      tableId,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY
    });

    // Start long press timer for delete
    const timer = setTimeout(() => {
      if (!dragState.isDragging) {
        deleteTable(tableId);
      }
    }, 1000);
    setLongPressTimer(timer);
  };

  // Handle drag movement
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragState.tableId) return;
    
    const deltaX = Math.abs(clientX - dragState.startX);
    const deltaY = Math.abs(clientY - dragState.startY);
    
    // Start dragging if moved more than 10 pixels
    if ((deltaX > 10 || deltaY > 10) && !dragState.isDragging) {
      setDragState(prev => ({ ...prev, isDragging: true }));
      
      // Cancel long press timer
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    }
    
    if (dragState.isDragging) {
      setDragState(prev => ({
        ...prev,
        currentX: clientX,
        currentY: clientY
      }));
    }
  };

  // Handle end of drag
  const handleDragEnd = () => {
    // Cancel long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (dragState.isDragging && dragState.tableId) {
      // Calculate new position
      const deltaX = dragState.currentX - dragState.startX;
      const deltaY = dragState.currentY - dragState.startY;
      
      setTables(prevTables => {
        const currentTable = prevTables.find(t => t.id === dragState.tableId);
        if (!currentTable) return prevTables;
        
        // Calculate new position with bounds
        const padding = 10;
        const headerSpace = 90;
        const maxX = containerDimensions.width - TABLE_SIZE - padding;
        const maxY = containerDimensions.height - TABLE_SIZE - padding;
        
        let newX = currentTable.position.x + deltaX;
        let newY = currentTable.position.y + deltaY;
        
        // Apply bounds
        newX = Math.max(padding, Math.min(maxX, newX));
        newY = Math.max(headerSpace, Math.min(maxY, newY));
        
        console.log(`Table ${dragState.tableId} moved to: (${newX}, ${newY})`);
        
        return prevTables.map(t => t.id === dragState.tableId 
          ? { ...t, position: { x: newX, y: newY } } 
          : t);
      });
      
      setModified(true);
    }
    
    // Reset drag state
    setDragState({
      isDragging: false,
      tableId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0
    });
  };

  // Mouse event handlers for web
  const handleMouseDown = (tableId: number, event: any) => {
    event.preventDefault();
    // Use relative coordinates to container
    const relativeX = event.clientX - containerOffset.x;
    const relativeY = event.clientY - containerOffset.y;
    handleDragStart(tableId, relativeX, relativeY);
  };

  const handleMouseMove = (event: any) => {
    if (dragState.tableId) {
      event.preventDefault();
      // Use relative coordinates to container
      const relativeX = event.clientX - containerOffset.x;
      const relativeY = event.clientY - containerOffset.y;
      handleDragMove(relativeX, relativeY);
    }
  };

  const handleMouseUp = (event: any) => {
    if (dragState.tableId) {
      event.preventDefault();
      handleDragEnd();
    }
  };

  // Touch event handlers for mobile
  const handleTouchStart = (tableId: number, event: GestureResponderEvent) => {
    const touch = event.nativeEvent.touches[0];
    handleDragStart(tableId, touch.pageX, touch.pageY);
  };

  const handleTouchMove = (event: GestureResponderEvent) => {
    if (dragState.tableId && event.nativeEvent.touches[0]) {
      const touch = event.nativeEvent.touches[0];
      handleDragMove(touch.pageX, touch.pageY);
    }
  };

  const handleTouchEnd = () => {
    if (dragState.tableId) {
      handleDragEnd();
    }
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
    const cols = Math.floor((containerDimensions.width - padding * 2) / (TABLE_SIZE + 15));
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

  // Delete a table
  const deleteTable = (tableId: number) => {
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
            setModified(true);
          }
        }
      ]
    );
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
          Touchez et glissez pour déplacer • Appui long pour supprimer
        </Text>

        <View 
          style={styles.floorPlanContainer}
          onLayout={handleLayoutChange}
        >
          {tables.map((table) => {
            let displayX = table.position.x;
            let displayY = table.position.y;
            
            // If this table is being dragged, adjust its position
            if (dragState.isDragging && dragState.tableId === table.id) {
              const deltaX = dragState.currentX - dragState.startX;
              const deltaY = dragState.currentY - dragState.startY;
              displayX += deltaX;
              displayY += deltaY;
            }
            
            return (
              <Pressable
                key={`table-${table.id}`}
                style={[
                  styles.tableItem,
                  {
                    backgroundColor: getStatusColor(table.status),
                    left: displayX,
                    top: displayY,
                    opacity: dragState.isDragging && dragState.tableId === table.id ? 0.8 : 1,
                    elevation: dragState.isDragging && dragState.tableId === table.id ? 8 : 3,
                    transform: [{
                      scale: dragState.isDragging && dragState.tableId === table.id ? 1.1 : 1
                    }],
                    ...(Platform.OS === 'web' && { cursor: 'pointer' as any })
                  }
                ]}
                onPressIn={(event: any) => {
                  if (Platform.OS === 'web') {
                    handleMouseDown(table.id, event);
                  } else {
                    handleTouchStart(table.id, event);
                  }
                }}
                onTouchMove={Platform.OS !== 'web' ? handleTouchMove : undefined}
                onTouchEnd={Platform.OS !== 'web' ? handleTouchEnd : undefined}
              >
                <Text style={styles.tableNumber}>{table.numero}</Text>
                <Text style={styles.placesText}>{table.places} places</Text>
              </Pressable>
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
