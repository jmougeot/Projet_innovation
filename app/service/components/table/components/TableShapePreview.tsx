import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TableShapePreviewProps } from '../types/table.types';
import { useWorkspaceDimensions, getStatusColor } from '../utils/table.utils';
import { tableModalStyles } from '../styles/table.styles';

// Composant pour afficher une forme de table
export const TableShapePreview: React.FC<TableShapePreviewProps> = ({ 
  shape, 
  isSelected, 
  onSelect, 
  option, 
  tableStatus = 'libre' 
}) => {
  const { width: workspaceWidth } = useWorkspaceDimensions();
  
  const getShapeStyle = () => {
    // Utiliser la couleur du statut de la table ou les couleurs par défaut pour la sélection
    const statusColor = getStatusColor(tableStatus);
    const selectedColor = '#194A8D'; // Couleur pour l'état sélectionné
    
    const baseSize = workspaceWidth * 0.15;
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
    <TouchableOpacity style={tableModalStyles.shapeContainer} onPress={onSelect}>
      <View style={getShapeStyle()}>
        <MaterialIcons
          name={option.icon}
          size={24}
          color={isSelected ? '#CAE1EF' : '#194A8D'}
        />
      </View>
      <Text style={[tableModalStyles.shapeName, isSelected && tableModalStyles.selectedShapeName]}>
        {option.name}
      </Text>
    </TouchableOpacity>
  );
};

export default TableShapePreview;
