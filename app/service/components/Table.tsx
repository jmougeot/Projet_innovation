import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Table as TableType } from '@/app/firebase/firebaseTables';

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Interface pour les props du composant
interface TableComponentProps {
  visible: boolean;
  onClose: () => void;
  onSave: (table: Omit<TableType, 'id' | 'status'>) => void;
  initialTable?: Partial<TableType>;
  isEditing?: boolean;
}

// Types de formes de tables disponibles
export type TableShape = 'round' | 'square' | 'rectangle' | 'oval';

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
}> = ({ shape, isSelected, onSelect, option }) => {
  const getShapeStyle = () => {
    const baseStyle = {
      width: screenWidth * 0.15,
      height: screenWidth * 0.15,
      backgroundColor: isSelected ? '#194A8D' : '#CAE1EF',
      borderWidth: 2,
      borderColor: isSelected ? '#CAE1EF' : '#194A8D',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      margin: 5,
    };

    switch (shape) {
      case 'round':
        return { ...baseStyle, borderRadius: screenWidth * 0.075 };
      case 'square':
        return { ...baseStyle, borderRadius: 8 };
      case 'rectangle':
        return { ...baseStyle, width: screenWidth * 0.2, borderRadius: 8 };
      case 'oval':
        return { ...baseStyle, width: screenWidth * 0.2, borderRadius: screenWidth * 0.075 };
      default:
        return baseStyle;
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
  isEditing = false
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
