import React from 'react';
import { View, Text } from 'react-native';
import { TableShapeRendererProps } from '../types/table.types';
import { useWorkspaceDimensions } from '../utils/table.utils';
import { tableShapeStyles } from '../styles/table.styles';

// Composant TableShapeRenderer intégré
export const TableShapeRenderer: React.FC<TableShapeRendererProps> = ({
  table,
  size,
  showText = true,
  textColor = '#194A8D',
  backgroundColor
}) => {
  const { width: workspaceWidth } = useWorkspaceDimensions();
  const defaultSize = size || workspaceWidth * 0.1;
  const shape = table.position.shape || 'round';
  
  const getShapeStyle = () => {
    const baseStyle = {
      width: defaultSize,
      height: defaultSize,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: backgroundColor || '#CAE1EF',
      elevation: 3,
      boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    };

    switch (shape) {
      case 'round':
        return {
          ...baseStyle,
          borderRadius: defaultSize / 2, // Perfectly round
        };
      case 'square':
        return {
          ...baseStyle,
          borderRadius: 4, // Sharp corners for square
        };
      case 'rectangle':
        return {
          ...baseStyle,
          width: defaultSize * 1.4, // Wider for rectangle
          height: defaultSize * 0.8, // Shorter height for rectangle
          borderRadius: 6,
        };
      case 'oval':
        return {
          ...baseStyle,
          width: defaultSize * 1.3, // Slightly wider for oval
          height: defaultSize * 0.9, // Slightly shorter for oval
          borderRadius: defaultSize / 2, // High border radius for oval shape
        };
      default:
        return {
          ...baseStyle,
          borderRadius: defaultSize / 2,
        };
    }
  };

  const getFontSize = () => {
    if (defaultSize < 50) return 8;
    if (defaultSize < 70) return 10;
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
            style={[tableShapeStyles.placesText, { fontSize: Math.max(6, defaultSize * 0.12) }]}
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

export default TableShapeRenderer;
