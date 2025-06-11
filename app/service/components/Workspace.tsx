import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, Dimensions } from 'react-native';

// ===================== TYPES ET INTERFACES =====================

export interface WorkspaceSize {
  size: number;
  screenWidth: number;
  screenHeight: number;
}

export interface WorkspaceTable {
  id: string;
  numero: string;
  position: {
    x: number;
    y: number;
  };
}

export interface WorkspaceContainerProps {
  children: React.ReactNode;
  hasUnsavedChanges?: boolean;
  coordinatesComponent?: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  borderColor?: string;
}

export interface WorkspaceCoordinatesProps {
  tables: WorkspaceTable[];
}

// ===================== HOOK POUR LA TAILLE DU WORKSPACE =====================

/**
 * Hook personnalisé pour gérer la taille adaptative du workspace
 * Le workspace sera toujours carré et s'adaptera à la taille de l'écran
 */
export const useWorkspaceSize = (): WorkspaceSize => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // Calculer la taille du workspace carré
  // Détecter l'orientation
  const isLandscape = dimensions.width > dimensions.height;
  
  let availableSpace: number;
  if (isLandscape) {
    // En mode paysage, utiliser la hauteur comme contrainte principale
    availableSpace = dimensions.height * 0.85; // 85% de la hauteur
  } else {
    // En mode portrait, utiliser la largeur comme contrainte principale  
    availableSpace = Math.min(dimensions.width * 0.95, dimensions.height * 0.75); // 95% largeur ou 75% hauteur
  }
  
  const size = Math.floor(availableSpace);

  return {
    size,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
  };
};

// ===================== COMPOSANT COORDONNÉES =====================

/**
 * Composant pour afficher les coordonnées des tables
 * dans le coin inférieur gauche du workspace
 */
export const WorkspaceCoordinates: React.FC<WorkspaceCoordinatesProps> = ({ tables }) => {
  if (tables.length === 0) {
    return null;
  }

  return (
    <View style={workspaceStyles.coordinates}>
      {tables.map((table, index) => (
        <Text key={`coord-${table.id}-${index}`} style={workspaceStyles.coordText}>
          {table.numero}: X: {Math.round(table.position.x)}, Y: {Math.round(table.position.y)}
        </Text>
      ))}
    </View>
  );
};

// ===================== COMPOSANT CONTAINER PRINCIPAL =====================

/**
 * Composant réutilisable pour afficher un workspace carré et adaptatif
 * Utilisé dans map_settings et plan_de_salle pour une cohérence visuelle
 */
export const WorkspaceContainer: React.FC<WorkspaceContainerProps> = ({
  children,
  hasUnsavedChanges = false,
  coordinatesComponent,
  style,
  backgroundColor = '#ffffff',
  borderColor = '#194A8D',
}) => {
  const { size } = useWorkspaceSize();

  return (
        <View
          style={[ workspaceStyles.workspace,
            {
              maxWidth: size,
              maxHeight: size,
              backgroundColor,
              borderColor,
            },
            style,
          ]}
        >
          {children}
          
          {/* Composant de coordonnées optionnel */}
          {coordinatesComponent && (
            <View style={workspaceStyles.coordinatesContainer}>
              {coordinatesComponent}
            </View>
          )}
        </View>
  );
};

// ===================== STYLES =====================

const workspaceStyles = StyleSheet.create({
    workspace: {
    borderRadius: 10,
    position: 'relative',
    borderWidth: 2,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 2,
    marginTop: 2,
    aspectRatio: 1, // Force un rapport 1:1 (carré parfait)
    flex: 1, // Prend l'espace disponible en respectant aspectRatio
    maxWidth: '100%',
    maxHeight: '100%',
  },
  
  // Styles des coordonnées
  coordinates: {
    // Ces styles sont appliqués dans le parent WorkspaceContainer
  },
  coordText: {
    fontSize: 9,
    color: '#194A8D',
    marginBottom: 1,
  },
  coordinatesContainer: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 8,
    borderRadius: 8,
    maxWidth: '40%',
    maxHeight: 150,
    overflow: 'hidden',
  },
});

// Export par défaut du composant principal
export default WorkspaceContainer;
