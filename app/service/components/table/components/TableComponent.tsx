import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Table as TableType } from '@/app/firebase/room&table/types';
import { TableComponentProps, TableShape } from '../types/table.types';
import { useWorkspaceDimensions } from '../utils/table.utils';
import { TABLE_SHAPES } from '../constants/table.constants';
import { TableShapePreview } from './TableShapePreview';
import { tableModalStyles } from '../styles/table.styles';

// Composant principal Table
const TableComponent: React.FC<TableComponentProps> = ({
  visible,
  onClose,
  onSave,
  initialTable,
  isEditing = false,
  tableStatus = 'libre' // Valeur par défaut
}) => {
  const { screenWidth, screenHeight } = useWorkspaceDimensions();
  
  const [selectedShape, setSelectedShape] = useState<TableShape>(
    (initialTable?.position as any)?.shape || 'round'
  );
  const [tableNumber, setTableNumber] = useState(initialTable?.numero || '');
  const [covers, setCovers] = useState(initialTable?.places?.toString() || '4');

  // Styles dynamiques pour le modal basés sur les dimensions du workspace
  const dynamicModalStyles = {
    modalContainer: {
      backgroundColor: '#fff',
      borderRadius: 20,
      width: screenWidth * 0.9,
      maxHeight: screenHeight * 0.8,
      elevation: 5,
      boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    },
    content: {
      padding: 20,
      maxHeight: screenHeight * 0.5,
    },
  };

  const [fontsLoaded] = useFonts({
    'AlexBrush': require('@/assets/fonts/AlexBrush-Regular.ttf'),
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
      <View style={tableModalStyles.modalOverlay}>
        <View style={dynamicModalStyles.modalContainer}>
          {/* En-tête */}
          <View style={tableModalStyles.header}>
            <Text style={tableModalStyles.title}>
              {isEditing ? 'Modifier la table' : 'Nouvelle table'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={tableModalStyles.closeButton}>
              <MaterialIcons name="close" size={24} color="#CAE1EF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={dynamicModalStyles.content} showsVerticalScrollIndicator={false}>
            {/* Section Forme */}
            <View style={tableModalStyles.section}>
              <Text style={tableModalStyles.sectionTitle}>Forme de la table</Text>
              <View style={tableModalStyles.shapesGrid}>
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
                <View style={tableModalStyles.shapeInfo}>
                  <Text style={tableModalStyles.shapeDescription}>
                    {selectedShapeOption.description}
                  </Text>
                  <Text style={tableModalStyles.shapeCapacity}>
                    Capacité: {selectedShapeOption.minCovers} à {selectedShapeOption.maxCovers} couverts
                  </Text>
                </View>
              )}
            </View>

            {/* Section Numéro/Nom */}
            <View style={tableModalStyles.section}>
              <Text style={tableModalStyles.sectionTitle}>Numéro ou nom de la table</Text>
              <TextInput
                style={tableModalStyles.input}
                value={tableNumber}
                onChangeText={setTableNumber}
                placeholder="Ex: T1, Table 1, Terrasse..."
                placeholderTextColor="#999"
                maxLength={20}
              />
            </View>

            {/* Section Nombre de couverts */}
            <View style={tableModalStyles.section}>
              <Text style={tableModalStyles.sectionTitle}>Nombre de couverts</Text>
              <View style={tableModalStyles.coversContainer}>
                <TouchableOpacity
                  style={tableModalStyles.coversButton}
                  onPress={() => {
                    const newValue = Math.max(1, parseInt(covers || '1') - 1);
                    setCovers(newValue.toString());
                  }}
                >
                  <MaterialIcons name="remove" size={20} color="#194A8D" />
                </TouchableOpacity>
                
                <TextInput
                  style={tableModalStyles.coversInput}
                  value={covers}
                  onChangeText={handleCoversChange}
                  keyboardType="numeric"
                  textAlign="center"
                  maxLength={2}
                />
                
                <TouchableOpacity
                  style={tableModalStyles.coversButton}
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
          <View style={tableModalStyles.actions}>
            <TouchableOpacity style={tableModalStyles.cancelButton} onPress={handleClose}>
              <Text style={tableModalStyles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tableModalStyles.saveButton} onPress={handleSave}>
              <Text style={tableModalStyles.saveButtonText}>
                {isEditing ? 'Modifier' : 'Créer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TableComponent;
