import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../styles';

export interface MissionSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export const MissionSearch: React.FC<MissionSearchProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Rechercher une mission...',
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClearSearch = () => {
    onSearchChange('');
  };

  return (
    <View style={commonStyles.searchContainer}>
      <View style={[
        commonStyles.searchInputContainer,
        isFocused && commonStyles.searchInputFocused
      ]}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={commonStyles.searchIcon}
        />
        <TextInput
          style={commonStyles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="#999"
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={handleClearSearch}
            style={commonStyles.clearSearchButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      
      {searchQuery.length > 0 && (
        <Text style={commonStyles.searchResultsText}>
          Recherche: &quot;{searchQuery}&quot;
        </Text>
      )}
    </View>
  );
};

export default MissionSearch;
