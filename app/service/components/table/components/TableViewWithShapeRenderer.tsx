import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { TableViewBaseProps } from '../types/table.types';
import { baseStyles } from '../styles/table.styles';
import Head from '@/app/components/Head';
import Reglage from '@/app/components/reglage';

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

export default TableViewWithShapeRenderer;
