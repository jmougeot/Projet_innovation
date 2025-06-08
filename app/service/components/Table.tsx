import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  ActivityIndicator,
  PanResponder
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Table as TableType } from '@/app/firebase/firebaseTables';
import Head from '@/app/components/Head';
import Reglage from '@/app/components/reglage';

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Constantes communes
export const TABLE_SIZE = 50;
export const EDIT_TABLE_WIDTH = 80;
export const EDIT_TABLE_HEIGHT = 80;

// Types de formes de tables disponibles
export type TableShape = 'round' | 'square' | 'rectangle' | 'oval';

// Fonctions utilitaires communes
export const getStatusColor = (status: TableType['status']) => {
  switch (status) {
    case 'libre': return '#4CAF50';
    case 'occupee': return '#EFBC51';
    case 'reservee': return '#CAE1EF';
  }
};

export const getStatusText = (status: TableType['status']) => {
  switch (status) {
    case 'libre': return 'Libre';
    case 'occupee': return 'Occupée';
    case 'reservee': return 'Réservée';
  }
};

export const getNextStatus = (currentStatus: TableType['status']): TableType['status'] => {
  const statuses: TableType['status'][] = ['libre', 'reservee', 'occupee'];
  const currentIndex = statuses.indexOf(currentStatus);
  return statuses[(currentIndex + 1) % statuses.length];
};

// Interface pour les propriétés du TableShapeRenderer
interface TableShapeRendererProps {
  table: TableType;
  size?: number;
  showText?: boolean;
  textColor?: string;
  backgroundColor?: string;
}

// Interface pour les propriétés du TableViewWithShapeRenderer
export interface TableViewBaseProps {
  title: string;
  loading: boolean;
  tables?: TableType[]; // Made optional since it's not used in the component
  customMenuItems?: {
    label: string;
    onPress: () => void;
    isLogout?: boolean;
  }[];
  children: React.ReactNode;
  showLegend?: boolean;
  enableEditMode?: boolean;
  isEditMode?: boolean;
  onEditModeToggle?: (enabled: boolean) => void;
}

// Composant TableShapeRenderer intégré
export const TableShapeRenderer: React.FC<TableShapeRendererProps> = ({
  table,
  size = screenWidth * 0.1,
  showText = true,
  textColor = '#194A8D',
  backgroundColor
}) => {
  const shape = table.position.shape || 'round';
  
  const getShapeStyle = () => {
    const baseStyle = {
      width: size,
      height: size,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: backgroundColor || '#CAE1EF',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    };

    switch (shape) {
      case 'round':
        return {
          ...baseStyle,
          borderRadius: size / 2, // Perfectly round
        };
      case 'square':
        return {
          ...baseStyle,
          borderRadius: 4, // Sharp corners for square
        };
      case 'rectangle':
        return {
          ...baseStyle,
          width: size * 1.4, // Wider for rectangle
          height: size * 0.8, // Shorter height for rectangle
          borderRadius: 6,
        };
      case 'oval':
        return {
          ...baseStyle,
          width: size * 1.3, // Slightly wider for oval
          height: size * 0.9, // Slightly shorter for oval
          borderRadius: size / 2, // High border radius for oval shape
        };
      default:
        return {
          ...baseStyle,
          borderRadius: size / 2,
        };
    }
  };

  const getFontSize = () => {
    if (size < 50) return 8;
    if (size < 70) return 10;
    return 12;
  };

  return (
    <View style={getShapeStyle()}>
      {showText && (
        <Text
          style={[
            tableShapeStyles.tableText,
            {
              color: textColor,
              fontSize: getFontSize(),
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          // @ts-ignore - Propriétés pour empêcher la sélection
          selectable={false}
          allowFontScaling={false}
        >
          {table.numero}
        </Text>
      )}
      
      {/* Indicateur de nombre de places */}
      {table.places && (
        <View style={[tableShapeStyles.placesIndicator, { top: -3, left: -3 }]}>
          <Text 
            style={[tableShapeStyles.placesText, { fontSize: Math.max(6, size * 0.12) }]}
            // @ts-ignore - Propriétés pour empêcher la sélection
            selectable={false}
            allowFontScaling={false}
          >
            {table.places}
          </Text>
        </View>
      )}
    </View>
  );
};

// Composant de base pour les vues de tables avec mode édition
export const TableViewWithShapeRenderer: React.FC<TableViewBaseProps> = ({
  title,
  loading,
  customMenuItems = [],
  children,
  showLegend = true,
  enableEditMode = false,
  isEditMode = false,
  onEditModeToggle
}) => {
  const renderEditModeToggle = () => {
    if (!enableEditMode || !onEditModeToggle) return null;
    
    return (
      <TouchableOpacity
        style={[baseStyles.editModeButton, isEditMode && baseStyles.editModeButtonActive]}
        onPress={() => onEditModeToggle(!isEditMode)}
      >
        <MaterialIcons 
          name={isEditMode ? "edit-off" : "edit"} 
          size={20} 
          color={isEditMode ? "#EFBC51" : "#194A8D"} 
        />
        <Text style={[baseStyles.editModeText, isEditMode && baseStyles.editModeTextActive]}>
          {isEditMode ? "Quitter Édition" : "Modifier Plan"}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderLegend = () => (
    <View style={baseStyles.legende}>
      <View style={baseStyles.legendeItem}>
        <View style={[baseStyles.legendeCarre, { backgroundColor: '#4CAF50' }]} />
        <Text style={baseStyles.legendeText}>Libre</Text>
      </View>
      <View style={baseStyles.legendeItem}>
        <View style={[baseStyles.legendeCarre, { backgroundColor: '#CAE1EF' }]} />
        <Text style={baseStyles.legendeText}>Réservée</Text>
      </View>
      <View style={baseStyles.legendeItem}>
        <View style={[baseStyles.legendeCarre, { backgroundColor: '#EFBC51' }]} />
        <Text style={baseStyles.legendeText}>Occupée</Text>
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={baseStyles.loadingContainer}>
      <ActivityIndicator size="large" color="#194A8D" />
      <Text style={baseStyles.loadingText}>Chargement des tables...</Text>
    </View>
  );

  return (
    <SafeAreaView style={baseStyles.container}>
      <Reglage position={{ top: 0, right: 15 }} menuItems={customMenuItems} />
      <Head title={title} />
      
      <View style={baseStyles.contentContainer}>
        {showLegend && renderLegend()}
        {renderEditModeToggle()}
        
        {loading ? renderLoading() : children}
      </View>
    </SafeAreaView>
  );
};

// Interface pour les props du composant modal
interface TableComponentProps {
  visible: boolean;
  onClose: () => void;
  onSave: (table: Omit<TableType, 'id' | 'status'>) => void;
  initialTable?: Partial<TableType>;
  isEditing?: boolean;
  tableStatus?: TableType['status']; // Nouveau prop pour le statut de la table
}

interface TableShapeOption {
  shape: TableShape;
  name: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  description: string;
  maxCovers: number;
  minCovers: number;
}

// Configuration des formes de tables
const TABLE_SHAPES: TableShapeOption[] = [
  {
    shape: 'round',
    name: 'Ronde',
    icon: 'radio-button-unchecked',
    description: 'Table ronde traditionnelle',
    minCovers: 2,
    maxCovers: 8
  },
  {
    shape: 'square',
    name: 'Carrée',
    icon: 'crop-square',
    description: 'Table carrée 4 places',
    minCovers: 2,
    maxCovers: 4
  },
  {
    shape: 'rectangle',
    name: 'Rectangulaire',
    icon: 'crop-landscape',
    description: 'Table rectangulaire',
    minCovers: 4,
    maxCovers: 12
  },
  {
    shape: 'oval',
    name: 'Ovale',
    icon: 'panorama-horizontal',
    description: 'Table ovale élégante',
    minCovers: 4,
    maxCovers: 10
  }
];

// Composant pour afficher une forme de table
const TableShapePreview: React.FC<{
  shape: TableShape;
  isSelected: boolean;
  onSelect: () => void;
  option: TableShapeOption;
  tableStatus?: TableType['status']; // Nouveau prop pour le statut de la table
}> = ({ shape, isSelected, onSelect, option, tableStatus = 'libre' }) => {
  const getShapeStyle = () => {
    // Utiliser la couleur du statut de la table ou les couleurs par défaut pour la sélection
    const statusColor = getStatusColor(tableStatus);
    const selectedColor = '#194A8D'; // Couleur pour l'état sélectionné
    
    const baseSize = screenWidth * 0.15;
    const baseStyle = {
      backgroundColor: isSelected ? selectedColor : statusColor,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      margin: 5,
    };

    switch (shape) {
      case 'round':
        return { 
          ...baseStyle, 
          width: baseSize,
          height: baseSize,
          borderRadius: baseSize / 2 // Perfectly round
        };
      case 'square':
        return { 
          ...baseStyle, 
          width: baseSize,
          height: baseSize,
          borderRadius: 4 // Sharp corners for square
        };
      case 'rectangle':
        return { 
          ...baseStyle, 
          width: baseSize * 1.4, // Wider for rectangle
          height: baseSize * 0.8, // Shorter height
          borderRadius: 6 
        };
      case 'oval':
        return { 
          ...baseStyle, 
          width: baseSize * 1.3, // Wider for oval
          height: baseSize * 0.9, // Slightly shorter
          borderRadius: baseSize / 2 // High border radius for oval shape
        };
      default:
        return { ...baseStyle, width: baseSize, height: baseSize, borderRadius: 8 };
    }
  };

  return (
    <TouchableOpacity style={styles.shapeContainer} onPress={onSelect}>
      <View style={getShapeStyle()}>
        <MaterialIcons
          name={option.icon}
          size={24}
          color={isSelected ? '#CAE1EF' : '#194A8D'}
        />
      </View>
      <Text style={[styles.shapeName, isSelected && styles.selectedShapeName]}>
        {option.name}
      </Text>
    </TouchableOpacity>
  );
};

// Composant principal Table
const TableComponent: React.FC<TableComponentProps> = ({
  visible,
  onClose,
  onSave,
  initialTable,
  isEditing = false,
  tableStatus = 'libre' // Valeur par défaut
}) => {
  const [selectedShape, setSelectedShape] = useState<TableShape>(
    (initialTable?.position as any)?.shape || 'round'
  );
  const [tableNumber, setTableNumber] = useState(initialTable?.numero || '');
  const [covers, setCovers] = useState(initialTable?.places?.toString() || '4');

  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../../assets/fonts/AlexBrush-Regular.ttf'),
  });

  const selectedShapeOption = TABLE_SHAPES.find(s => s.shape === selectedShape);

  const handleSave = () => {
    // Validation des données
    if (!tableNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un numéro ou nom de table');
      return;
    }

    const coversNumber = parseInt(covers);
    if (isNaN(coversNumber) || coversNumber < 1) {
      Alert.alert('Erreur', 'Le nombre de couverts doit être supérieur à 0');
      return;
    }

    if (selectedShapeOption) {
      if (coversNumber < selectedShapeOption.minCovers || coversNumber > selectedShapeOption.maxCovers) {
        Alert.alert(
          'Erreur',
          `Pour une table ${selectedShapeOption.name.toLowerCase()}, le nombre de couverts doit être entre ${selectedShapeOption.minCovers} et ${selectedShapeOption.maxCovers}`
        );
        return;
      }
    }

    // Créer l'objet table avec la forme sélectionnée
    const table: Omit<TableType, 'id' | 'status'> = {
      numero: tableNumber.trim(),
      places: coversNumber,
      position: {
        x: initialTable?.position?.x || 50,
        y: initialTable?.position?.y || 50,
        shape: selectedShape
      } as any
    };

    onSave(table);
    handleClose();
  };

  const handleClose = () => {
    // Reset du formulaire
    setSelectedShape('round');
    setTableNumber('');
    setCovers('4');
    onClose();
  };

  const handleCoversChange = (text: string) => {
    // Ne permettre que les chiffres
    const cleanText = text.replace(/[^0-9]/g, '');
    setCovers(cleanText);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* En-tête */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEditing ? 'Modifier la table' : 'Nouvelle table'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#CAE1EF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Section Forme */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Forme de la table</Text>
              <View style={styles.shapesGrid}>
                {TABLE_SHAPES.map((option) => (
                  <TableShapePreview
                    key={option.shape}
                    shape={option.shape}
                    isSelected={selectedShape === option.shape}
                    onSelect={() => setSelectedShape(option.shape)}
                    option={option}
                    tableStatus={tableStatus}
                  />
                ))}
              </View>
              {selectedShapeOption && (
                <View style={styles.shapeInfo}>
                  <Text style={styles.shapeDescription}>
                    {selectedShapeOption.description}
                  </Text>
                  <Text style={styles.shapeCapacity}>
                    Capacité: {selectedShapeOption.minCovers} à {selectedShapeOption.maxCovers} couverts
                  </Text>
                </View>
              )}
            </View>

            {/* Section Numéro/Nom */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Numéro ou nom de la table</Text>
              <TextInput
                style={styles.input}
                value={tableNumber}
                onChangeText={setTableNumber}
                placeholder="Ex: T1, Table 1, Terrasse..."
                placeholderTextColor="#999"
                maxLength={20}
              />
            </View>

            {/* Section Nombre de couverts */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nombre de couverts</Text>
              <View style={styles.coversContainer}>
                <TouchableOpacity
                  style={styles.coversButton}
                  onPress={() => {
                    const newValue = Math.max(1, parseInt(covers || '1') - 1);
                    setCovers(newValue.toString());
                  }}
                >
                  <MaterialIcons name="remove" size={20} color="#194A8D" />
                </TouchableOpacity>
                
                <TextInput
                  style={styles.coversInput}
                  value={covers}
                  onChangeText={handleCoversChange}
                  keyboardType="numeric"
                  textAlign="center"
                  maxLength={2}
                />
                
                <TouchableOpacity
                  style={styles.coversButton}
                  onPress={() => {
                    const newValue = parseInt(covers || '0') + 1;
                    const maxAllowed = selectedShapeOption?.maxCovers || 12;
                    if (newValue <= maxAllowed) {
                      setCovers(newValue.toString());
                    }
                  }}
                >
                  <MaterialIcons name="add" size={20} color="#194A8D" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Boutons d'action */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Modifier' : 'Créer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#194A8D',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 5,
  },
  legende: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#F3EFEF',
  },
  legendeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendeCarre: {
    width: 14,
    height: 14,
    marginRight: 6,
    borderRadius: 3,
  },
  legendeText: {
    color: '#083F8C',
    fontSize: 12,
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
  editModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CAE1EF',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  editModeButtonActive: {
    backgroundColor: '#EFBC51',
  },
  editModeText: {
    color: '#194A8D',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  editModeTextActive: {
    color: '#194A8D',
  },
});

const tableShapeStyles = StyleSheet.create({
  tableText: {
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    zIndex: 2,
  },
  placesIndicator: {
    position: 'absolute',
    backgroundColor: '#194A8D',
    borderRadius: 8,
    minWidth: 12,
    minHeight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  placesText: {
    color: '#CAE1EF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    backgroundColor: '#194A8D',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CAE1EF',
    fontFamily: 'AlexBrush',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
    maxHeight: screenHeight * 0.5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#194A8D',
    marginBottom: 10,
  },
  shapesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  shapeContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  shapeName: {
    fontSize: 12,
    color: '#194A8D',
    textAlign: 'center',
    marginTop: 5,
  },
  selectedShapeName: {
    fontWeight: 'bold',
    color: '#194A8D',
  },
  shapeInfo: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#194A8D',
  },
  shapeDescription: {
    fontSize: 14,
    color: '#194A8D',
    marginBottom: 5,
  },
  shapeCapacity: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CAE1EF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#194A8D',
    backgroundColor: '#F8F9FA',
  },
  coversContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coversButton: {
    backgroundColor: '#CAE1EF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coversInput: {
    borderWidth: 1,
    borderColor: '#CAE1EF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#194A8D',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 15,
    minWidth: 60,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#194A8D',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 1,
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#CAE1EF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});



export default TableComponent;
