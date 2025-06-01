import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../styles/commonStyles';
import { Mission } from '../types';
import { Picker } from '@react-native-picker/picker';

export interface MissionFormProps {
  mission?: Mission | null;
  onSubmit: (missionData: Partial<Mission>) => void;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

const MissionForm: React.FC<MissionFormProps> = ({
  mission,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    titre: mission?.titre || '',
    description: mission?.description || '',
    points: mission?.points || 0,
    recurrence: {
      frequence: mission?.recurrence?.frequence || 'daily' as 'daily' | 'weekly' | 'monthly',
      dateDebut: mission?.recurrence?.dateDebut || new Date(),
    },
    targetValue: mission?.targetValue || undefined,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (formData.points <= 0) {
      newErrors.points = 'Les points doivent être supérieurs à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    onSubmit({
      ...formData,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <ScrollView style={commonStyles.container}>
      <View style={{ padding: 20 }}>
        <Text style={commonStyles.formTitle}>
          {isEditing ? 'Modifier la mission' : 'Nouvelle mission'}
        </Text>

        <View style={commonStyles.inputGroup}>
          <Text style={commonStyles.label}>Titre *</Text>
          <TextInput
            value={formData.titre}
            onChangeText={(text) => setFormData({ ...formData, titre: text })}
            placeholder="Titre de la mission"
            style={[commonStyles.input, errors.titre && commonStyles.inputError]}
          />
          {errors.titre && <Text style={commonStyles.errorText}>{errors.titre}</Text>}
        </View>

        <View style={commonStyles.inputGroup}>
          <Text style={commonStyles.label}>Description *</Text>
          <TextInput
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Description de la mission"
            multiline
            numberOfLines={4}
            style={[commonStyles.textArea, errors.description && commonStyles.inputError]}
          />
          {errors.description && <Text style={commonStyles.errorText}>{errors.description}</Text>}
        </View>

        <View style={commonStyles.inputGroup}>
          <Text style={commonStyles.label}>Points *</Text>
          <TextInput
            value={formData.points.toString()}
            onChangeText={(text) => {
              const points = parseInt(text) || 0;
              setFormData({ ...formData, points });
            }}
            placeholder="Points attribués"
            keyboardType="numeric"
            style={[commonStyles.input, errors.points && commonStyles.inputError]}
          />
          {errors.points && <Text style={commonStyles.errorText}>{errors.points}</Text>}
        </View>

        <View style={commonStyles.inputGroup}>
          <Text style={commonStyles.label}>Fréquence</Text>
          <View style={commonStyles.input}>
            <Picker
              selectedValue={formData.recurrence.frequence}
              onValueChange={(value) => 
                setFormData({ 
                  ...formData, 
                  recurrence: { ...formData.recurrence, frequence: value }
                })
              }
            >
              <Picker.Item label="Quotidienne" value="daily" />
              <Picker.Item label="Hebdomadaire" value="weekly" />
              <Picker.Item label="Mensuelle" value="monthly" />
            </Picker>
          </View>
        </View>

        <View style={commonStyles.inputGroup}>
          <Text style={commonStyles.label}>Date de début</Text>
          <TouchableOpacity 
            style={commonStyles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={commonStyles.dateButtonText}>
              {formatDate(formData.recurrence.dateDebut)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={commonStyles.inputGroup}>
          <Text style={commonStyles.label}>Valeur cible (optionnel)</Text>
          <TextInput
            value={formData.targetValue?.toString() || ''}
            onChangeText={(text) => {
              const targetValue = text ? parseInt(text) : undefined;
              setFormData({ ...formData, targetValue });
            }}
            placeholder="Valeur cible pour la progression"
            keyboardType="numeric"
            style={commonStyles.input}
          />
        </View>

        <View style={commonStyles.buttonContainer}>
          <TouchableOpacity
            style={[commonStyles.button, commonStyles.cancelButton]}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={commonStyles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[commonStyles.button, commonStyles.primaryButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={commonStyles.primaryButtonText}>
              {isEditing ? 'Modifier' : 'Créer'}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={formData.recurrence.dateDebut}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setFormData({
                  ...formData,
                  recurrence: { ...formData.recurrence, dateDebut: selectedDate }
                });
              }
            }}
          />
        )}
      </View>
    </ScrollView>
  );
};

export { MissionForm };
export default MissionForm;
