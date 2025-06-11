import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, PanResponder, Alert, ActivityIndicator } from "react-native";
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Table, getTables, addTable as saveTable, deleteTable, updateTables, clearTableCache as clearTablesCache, DEFAULT_ROOM_ID } from '../../firebase/firebaseTables';
import { getRealtimeTablesCache } from '../../firebase/firebaseRealtimeCache';
import { TableComponent, getStatusColor, TableShapeRenderer } from '../components/Table';
import ConfirmModal from '../components/ConfirmModal';
import TableOptionsModal from '../components/TableOptionsModal';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '@/app/components/Header';
import { WorkspaceContainer, WorkspaceCoordinates, useWorkspaceSize } from '../components/Workspace';
import { useRestaurantSelection } from '../../firebase/RestaurantSelectionContext';

// Proportions relatives pour les dimensions des tables (en pourcentage du workspace)
const TABLE_SIZE_RATIO = 0.08; // 8% de la taille du workspace

// Fonctions utilitaires pour normaliser les positions
const normalizePosition = (position: { x: number, y: number }, workspaceSize: number) => {
  return {
    x: Math.min(Math.max(position.x / workspaceSize, 0), 1 - TABLE_SIZE_RATIO),
    y: Math.min(Math.max(position.y / workspaceSize, 0), 1 - TABLE_SIZE_RATIO)
  };
};

const denormalizePosition = (normalizedPosition: { x: number, y: number }, workspaceSize: number) => {
  return {
    x: normalizedPosition.x * workspaceSize,
    y: normalizedPosition.y * workspaceSize
  };
};

interface DraggableTableProps {
  table: Table;
  size?: number;
  showText?: boolean;
  textColor?: string;
  style?: any;
  onPositionChange: (id: number, x: number, y: number) => void;
  onEditTable: (table: Table) => void;
  onDeleteTable: (table: Table) => void;
  workspaceWidth: number;
  workspaceHeight: number;
}

// Composant DraggableTable pour le mode édition
const DraggableTable: React.FC<DraggableTableProps> = ({
  table,
  size,
  showText = true,
  textColor = '#194A8D',
  style,
  onPositionChange,
  onEditTable,
  onDeleteTable,
  workspaceWidth,
  workspaceHeight
}) => {
  const [position, setPosition] = useState(() => {
    // Dénormaliser la position pour l'affichage
    return denormalizePosition(
      { x: table.position.x, y: table.position.y },
      workspaceWidth
    );
  });
  const [lastTap, setLastTap] = useState<number | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  // Mettre à jour la position locale quand la table change
  useEffect(() => {
    const denormalizedPos = denormalizePosition(
      { x: table.position.x, y: table.position.y },
      workspaceWidth
    );
    setPosition(denormalizedPos);
  }, [table.position.x, table.position.y, table.id, workspaceWidth]);

  // Fonction pour contraindre la position dans les limites du workspace
  const constrainPosition = (newX: number, newY: number) => {
    const tableSize = size || 60;
    const minX = 0;
    const maxX = workspaceWidth - tableSize - 20;
    const minY = 0;
    const maxY = workspaceHeight - tableSize - 20;

    const constrainedX = Math.max(minX, Math.min(maxX, newX));
    const constrainedY = Math.max(minY, Math.min(maxY, newY));

    return { x: constrainedX, y: constrainedY };
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      // Empêcher la sélection de texte dès le début du touch
      evt.preventDefault?.();
      
      // Début du drag - gérer le double-tap
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
        // Double-tap détecté - ouvrir la modal d'options
        setShowOptionsModal(true);
        setLastTap(null);
      } else {
        setLastTap(now);
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      // Empêcher la sélection pendant le mouvement
      evt.preventDefault?.();
      
      const newX = position.x + gestureState.dx;
      const newY = position.y + gestureState.dy;
      const constrainedPosition = constrainPosition(newX, newY);
      setPosition(constrainedPosition);
    },
    onPanResponderRelease: (evt, gestureState) => {
      const finalX = position.x + gestureState.dx;
      const finalY = position.y + gestureState.dy;
      const constrainedPosition = constrainPosition(finalX, finalY);
      setPosition(constrainedPosition);
      
      // Normaliser la position avant de l'envoyer
      const normalizedPosition = normalizePosition(constrainedPosition, workspaceWidth);
      onPositionChange(table.id, normalizedPosition.x, normalizedPosition.y);
    },
  });

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        style,
        {
          left: position.x,
          top: position.y,
          position: 'absolute',
        }
      ]}
      // Propriétés pour empêcher la sélection de texte
      pointerEvents="box-only"
      // @ts-ignore - Propriétés spécifiques React Native
      accessible={false}
      importantForAccessibility="no"
    >
      <View 
        style={[
          { 
            userSelect: 'none', // Pour le web
            // @ts-ignore - Propriétés spécifiques à React Native
            selectable: false,
            allowFontScaling: false,
          },
          // @ts-ignore - Styles web pour empêcher la sélection
          {
            WebkitUserSelect: 'none',
            MozUserSelect: 'none', 
            msUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
          } as any
        ]}
        // @ts-ignore - Propriétés supplémentaires pour empêcher la sélection
        accessible={false}
        importantForAccessibility="no"
        pointerEvents="none"
      >
        <TableShapeRenderer
          table={table}
          size={size}
          showText={showText}
          textColor={textColor}
          backgroundColor={getStatusColor(table.status)}
        />
      </View>
      
      <TableOptionsModal
        visible={showOptionsModal}
        tableName={table.numero}
        onEdit={() => {
          setShowOptionsModal(false);
          onEditTable(table);
        }}
        onDelete={() => {
          setShowOptionsModal(false);
          onDeleteTable(table);
        }}
        onCancel={() => setShowOptionsModal(false)}
      />
    </View>
  );
};

// Composant principal MapSettings
export default function MapSettings() {
  const router = useRouter();
  const { selectedRestaurant } = useRestaurantSelection();
  // État local pour les tables
  const [tables, setTables] = useState<Table[]>([]);
  const [originalTables, setOriginalTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // États pour le modal de création/édition de table
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  
  // État pour le modal de confirmation d'annulation
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Dimensions du workspace adaptives avec le hook personnalisé
  const { size: workspaceSize } = useWorkspaceSize();
  const workspaceWidth = workspaceSize;
  const workspaceHeight = workspaceSize;

  // Calcul des dimensions des tables proportionnelles au workspace
  const tableSize = workspaceSize * TABLE_SIZE_RATIO;

  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../../assets/fonts/AlexBrush-Regular.ttf'),
  });

  // Chargement des tables depuis Firebase
  const loadTables = useCallback(async () => {
    if (!selectedRestaurant) {
      console.warn('Aucun restaurant sélectionné');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const tablesData = await getTables(DEFAULT_ROOM_ID, true, selectedRestaurant.id);
      setTables(tablesData);
      setOriginalTables(JSON.parse(JSON.stringify(tablesData))); // Deep copy pour comparaison
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erreur lors du chargement des tables:', error);
      Alert.alert('Erreur', 'Impossible de charger les tables');
    } finally {
      setLoading(false);
    }
  }, [selectedRestaurant]);

  // Fonction pour comparer les tables et détecter les changements
  const checkForUnsavedChanges = useCallback((currentTables: Table[]) => {
    const currentTablesStr = JSON.stringify(currentTables);
    const originalTablesStr = JSON.stringify(originalTables);
    const hasChanges = currentTablesStr !== originalTablesStr;
    
    console.log('🔍 Checking for unsaved changes:');
    console.log('Has changes:', hasChanges);
    console.log('Current tables length:', currentTables.length);
    console.log('Original tables length:', originalTables.length);
    
    if (hasChanges) {
      console.log('📊 Tables are different!');
      console.log('Current tables positions:', currentTables.map(t => ({ id: t.id, x: t.position.x, y: t.position.y })));
      console.log('Original tables positions:', originalTables.map(t => ({ id: t.id, x: t.position.x, y: t.position.y })));
    }
    
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  }, [originalTables]);

  // Sauvegarde manuelle de toutes les modifications
  const saveAllChanges = useCallback(async () => {
    if (!selectedRestaurant) {
      Alert.alert('Erreur', 'Aucun restaurant sélectionné');
      return;
    }

    try {
      setSaving(true);
      await updateTables(tables, DEFAULT_ROOM_ID, selectedRestaurant.id);
      
      // Invalider les caches après sauvegarde
      clearTablesCache(DEFAULT_ROOM_ID);
      const realtimeCache = getRealtimeTablesCache();
      realtimeCache.forceReconnect(); // Force une reconnexion pour obtenir les dernières données
      
      setOriginalTables(JSON.parse(JSON.stringify(tables))); // Mettre à jour la référence
      setHasUnsavedChanges(false);
      Alert.alert('Succès', 'Toutes les modifications ont été sauvegardées');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde globale:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    } finally {
      setSaving(false);
    }
  }, [tables, selectedRestaurant]);

  // Annuler toutes les modifications non sauvegardées
  const discardChanges = useCallback(() => {
    console.log('🔥 discardChanges called!');
    console.log('hasUnsavedChanges:', hasUnsavedChanges);
    console.log('Original tables:', originalTables);
    console.log('Current tables:', tables);
    
    // Afficher le modal de confirmation au lieu de Alert.alert
    setShowDiscardModal(true);
  }, [hasUnsavedChanges, originalTables, tables]);

  // Fonction pour confirmer l'annulation des changements
  const confirmDiscardChanges = useCallback(() => {
    console.log('✅ User confirmed discard changes');
    console.log('Discarding changes - Original tables:', originalTables);
    console.log('Current tables before reset:', tables);
    
    // Créer une copie profonde des tables originales avec de nouvelles références d'objets
    const resetTables = originalTables.map(table => ({
      ...table,
      position: { ...table.position }
    }));
    
    setTables(resetTables);
    setHasUnsavedChanges(false);
    setShowDiscardModal(false);
    
    console.log('Tables after reset:', resetTables);
  }, [originalTables, tables]);

  const handlePositionChange = useCallback((id: number, x: number, y: number) => {
    setTables(prevTables => {
      const updatedTables = prevTables.map(table =>
        table.id === id ? { ...table, position: { ...table.position, x, y } } : table
      );
      
      // Vérifier s'il y a des changements non sauvegardés
      checkForUnsavedChanges(updatedTables);
      
      return updatedTables;
    });
  }, [checkForUnsavedChanges]);

  const addNewTable = useCallback(() => {
    setEditingTable(null);
    setShowTableModal(true);
  }, []);

  const handleSaveTable = useCallback(async (tableData: Omit<Table, 'id' | 'status'>) => {
    if (!selectedRestaurant) {
      Alert.alert('Erreur', 'Aucun restaurant sélectionné');
      return;
    }

    try {
      if (editingTable) {
        // Modification d'une table existante
        const updatedTable: Table = {
          ...editingTable,
          ...tableData,
          id: editingTable.id,
          status: editingTable.status,
          position: {
            ...editingTable.position, // Preserve existing position data
            ...tableData.position // Override with new position data
          }
        };
        
        await saveTable(updatedTable, DEFAULT_ROOM_ID, selectedRestaurant.id);
        
        // Invalider le cache après modification
        clearTablesCache(DEFAULT_ROOM_ID);
        const realtimeCache = getRealtimeTablesCache();
        realtimeCache.forceReconnect();
        
        setTables(prev => {
          const updatedTables = prev.map(t => t.id === editingTable.id ? updatedTable : t);
          checkForUnsavedChanges(updatedTables);
          return updatedTables;
        });
      } else {
        // Création d'une nouvelle table
        const newId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
        
        // Générer une position aléatoire normalisée (0-1)
        const randomNormalizedX = Math.random() * (1 - TABLE_SIZE_RATIO - 0.1) + 0.05;
        const randomNormalizedY = Math.random() * (1 - TABLE_SIZE_RATIO - 0.1) + 0.05;
        
        const newTable: Table = {
          ...tableData,
          id: newId,
          status: "libre",
          position: {
            ...tableData.position, // Preserve the shape and other position properties
            x: randomNormalizedX,
            y: randomNormalizedY
          }
        };

        await saveTable(newTable, DEFAULT_ROOM_ID, selectedRestaurant.id);
        
        // Invalider le cache après création
        clearTablesCache(DEFAULT_ROOM_ID);
        const realtimeCache = getRealtimeTablesCache();
        realtimeCache.forceReconnect();
        
        setTables(prev => {
          const updatedTables = [...prev, newTable];
          checkForUnsavedChanges(updatedTables);
          return updatedTables;
        });
      }
      
      // Close modal and reset state after successful save
      setShowTableModal(false);
      setEditingTable(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la table');
    }
  }, [editingTable, tables, checkForUnsavedChanges]);

  const handleEditTable = useCallback((table: Table) => {
    setEditingTable(table);
    setShowTableModal(true);
  }, []);

  const removeTable = useCallback(async (id: number) => {
    if (!selectedRestaurant) {
      Alert.alert('Erreur', 'Aucun restaurant sélectionné');
      return;
    }

    try {
      await deleteTable(id, DEFAULT_ROOM_ID, selectedRestaurant.id);
      
      // Invalider le cache après suppression
      clearTablesCache(DEFAULT_ROOM_ID);
      const realtimeCache = getRealtimeTablesCache();
      realtimeCache.forceReconnect();
      
      setTables(prev => {
        const updatedTables = prev.filter(table => table.id !== id);
        checkForUnsavedChanges(updatedTables);
        return updatedTables;
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  }, [checkForUnsavedChanges, selectedRestaurant]);

  const handleDeleteTable = useCallback((table: Table) => {
    removeTable(table.id);
  }, [removeTable]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Debug effect pour surveiller hasUnsavedChanges
  useEffect(() => {
    console.log('🎛️ Controls state changed - hasUnsavedChanges:', hasUnsavedChanges, 'saving:', saving);
  }, [hasUnsavedChanges, saving]);

  // Menu items pour le composant réglage
  const reglageMenuItems = [
    {
      label: 'Retour au plan',
      onPress: () => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/service');
        }
      }
    },
    {
      label: 'Profil',
      onPress: () => router.push('/Profil/avatar' as any)
    },
    {
      label: 'Paramètres',
      onPress: () => {}
    },
    {
      label: 'Déconnexion',
      onPress: () => {},
      isLogout: true
    },
  ];

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Modifier le Plan de Salle" 
          showBackButton={true}
          backgroundColor="#194A8D"
          textColor="#FFFFFF"
          useHeadComponent={true}
          customBackRoute="/service"
          showReglage={true}
          reglageMenuItems={reglageMenuItems}
        />
        <View style={styles.contentWrapper}>
          <ActivityIndicator size="large" color="#194A8D" />
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#194A8D' }}>
            {!fontsLoaded ? 'Chargement des polices...' : 'Chargement des tables...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Composant pour les contrôles (boutons)
  const renderControls = () => (
    <View style={styles.controls}>
      {hasUnsavedChanges && (
        <Pressable 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={saveAllChanges}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#194A8D" />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color="#194A8D" />
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            </>
          )}
        </Pressable>
      )}
      
      {hasUnsavedChanges && (
        <Pressable 
          style={styles.discardButton} 
          onPress={() => {
            console.log('🟡 Discard button pressed!');
            discardChanges();
          }}
          disabled={saving}
        >
          <MaterialIcons name="undo" size={20} color="#fff" />
          <Text style={styles.discardButtonText}>Annuler</Text>
        </Pressable>
      )}
      
      <Pressable style={styles.addButton} onPress={addNewTable}>
        <Text style={styles.addButtonText}>+ Nouvelle table</Text>
      </Pressable>
      
      <Pressable 
        style={[styles.addButton, styles.removeButton]} 
        onPress={() => tables.length > 0 && removeTable(tables[tables.length - 1].id)}
      >
        <Text style={[styles.addButtonText, styles.removeButtonText]}>- Supprimer dernière</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Modifier le Plan de Salle" 
        showBackButton={true}
        backgroundColor="#194A8D"
        textColor="#FFFFFF"
        useHeadComponent={true}
        customBackRoute="/service"
        showReglage={true}
        reglageMenuItems={reglageMenuItems}
      />
      
      <View style={styles.contentWrapper}>
        <WorkspaceContainer
          hasUnsavedChanges={hasUnsavedChanges}
          coordinatesComponent={<WorkspaceCoordinates tables={tables.map(table => ({ ...table, id: table.id.toString() }))} />}
          style={{ flex: 1 }}
        >
          {tables.map((table, index) => (
            <DraggableTable
              key={`table-${table.id}-${index}`}
              table={table}
              size={tableSize}
              showText={true}
              textColor="#194A8D"
              onPositionChange={handlePositionChange}
              onEditTable={handleEditTable}
              onDeleteTable={handleDeleteTable}
              workspaceWidth={workspaceWidth}
              workspaceHeight={workspaceHeight}
            />
          ))}
        </WorkspaceContainer>

        {renderControls()}
        
        {/* Modal de création/édition de table */}
        <TableComponent
          visible={showTableModal}
          onClose={() => {
            setShowTableModal(false);
            setEditingTable(null);
          }}
          onSave={handleSaveTable}
          initialTable={editingTable || undefined}
          isEditing={!!editingTable}
          tableStatus={editingTable?.status || 'libre'}
        />
        
        {/* Modal de confirmation d'annulation */}
        <ConfirmModal
          visible={showDiscardModal}
          title="Annuler les modifications"
          message="Êtes-vous sûr de vouloir annuler toutes les modifications non sauvegardées ?"
          cancelText="Non"
          confirmText="Oui"
          onCancel={() => setShowDiscardModal(false)}
          onConfirm={confirmDiscardChanges}
        />
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
  workspaceContainer: {
    flex: 1,
  },
  header: {
    padding: 15,
    backgroundColor: '#194A8D',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#CAE1EF',
    textAlign: 'center',
    fontFamily: 'AlexBrush',
  },
  unsavedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(239, 188, 81, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  unsavedText: {
    color: '#EFBC51',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  workspace: {
    backgroundColor: '#ffffff',
    flex: 1,
    margin: 10,
    borderRadius: 10,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#194A8D',
    minHeight: 300, // Hauteur minimum
  },
  tableText: {
    color: '#194A8D',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  coordinates: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 8,
    borderRadius: 8,
    maxWidth: '40%', // 40% de la largeur de l'écran
    maxHeight: 150,
    overflow: 'hidden',
  },
  coordText: {
    fontSize: 9,
    color: '#194A8D',
    marginBottom: 1,
  },
  controls: {
    padding: 15,
    backgroundColor: '#194A8D',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    minHeight: 70,
    flexWrap: 'wrap',
    gap: 8,
  },
  addButton: {
    backgroundColor: '#CAE1EF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    minWidth: 120,
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
  },
  addButtonText: {
    color: '#194A8D',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  removeButtonText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 140,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  discardButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 120,
  },
  discardButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
});

