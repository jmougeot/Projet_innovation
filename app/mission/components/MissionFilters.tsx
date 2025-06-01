import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { commonStyles } from '../styles';

export interface MissionFiltersProps {
  selectedRecurrence: string;
  minPoints?: number;
  maxPoints?: number;
  onRecurrenceChange: (recurrence: string) => void;
  onPointsRangeChange?: (min: number, max: number) => void;
  onClearFilters: () => void;
}

export const MissionFilters: React.FC<MissionFiltersProps> = ({
  selectedRecurrence,
  onRecurrenceChange,
  onClearFilters,
}) => {
  const recurrenceOptions = [
    { label: 'Toutes les récurrences', value: '' },
    { label: 'Quotidien', value: 'daily' },
    { label: 'Hebdomadaire', value: 'weekly' },
    { label: 'Mensuel', value: 'monthly' },
  ];

  return (
    <View style={commonStyles.filterContainer}>
      <Text style={commonStyles.filterTitle}>Filtres</Text>
      
      <View style={commonStyles.filterRow}>
        <View style={commonStyles.pickerContainer}>
          <Text style={commonStyles.pickerLabel}>Récurrence</Text>
          <Picker
            selectedValue={selectedRecurrence}
            onValueChange={onRecurrenceChange}
            style={commonStyles.picker}
          >
            {recurrenceOptions.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      {selectedRecurrence && (
        <TouchableOpacity
          style={commonStyles.clearFiltersButton}
          onPress={onClearFilters}
        >
          <Text style={commonStyles.clearFiltersText}>
            Effacer les filtres
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
