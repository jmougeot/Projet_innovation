import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Table } from '../firebase/firebaseTables';

// Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get('window');

interface TableShapeRendererProps {
  table: Table;
  size?: number;
  showText?: boolean;
  textColor?: string;
}

// Composant pour rendre visuellement les différentes formes de tables
const TableShapeRenderer: React.FC<TableShapeRendererProps> = ({
  table,
  size = screenWidth * 0.08,
  showText = true,
  textColor = '#194A8D'
}) => {
  const shape = table.position.shape || 'round';
  
  const getShapeStyle = () => {
    const baseStyle = {
      width: size,
      height: size,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 2,
      borderColor: '#194A8D',
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
          borderRadius: size / 2,
        };
      case 'square':
        return {
          ...baseStyle,
          borderRadius: 8,
        };
      case 'rectangle':
        return {
          ...baseStyle,
          width: size * 1.4,
          borderRadius: 8,
        };
      case 'oval':
        return {
          ...baseStyle,
          width: size * 1.4,
          borderRadius: size / 2,
        };
      default:
        return {
          ...baseStyle,
          borderRadius: size / 2,
        };
    }
  };

  const getTableIcon = () => {
    switch (shape) {
      case 'round':
        return 'radio-button-unchecked';
      case 'square':
        return 'crop-square';
      case 'rectangle':
        return 'crop-landscape';
      case 'oval':
        return 'panorama-horizontal';
      default:
        return 'radio-button-unchecked';
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
            styles.tableText,
            {
              color: textColor,
              fontSize: getFontSize(),
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {table.numero}
        </Text>
      )}
      
      {/* Icône subtile pour indiquer la forme dans le coin */}
      <View style={[styles.shapeIndicator, { bottom: -1, right: -1 }]}>
        <MaterialIcons
          name={getTableIcon()}
          size={Math.max(8, size * 0.15)}
          color="rgba(25, 74, 141, 0.6)"
        />
      </View>
      
      {/* Indicateur de nombre de places */}
      {table.places && (
        <View style={[styles.placesIndicator, { top: -3, left: -3 }]}>
          <Text style={[styles.placesText, { fontSize: Math.max(6, size * 0.12) }]}>
            {table.places}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tableText: {
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    zIndex: 2,
  },
  shapeIndicator: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 1,
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

export default TableShapeRenderer;
