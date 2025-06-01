import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { modalStyles } from '../styles';
import { Mission } from '../types';

export interface ConfirmDeleteModalProps {
  visible: boolean;
  mission: Mission | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  visible,
  mission,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!mission) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Ionicons name="warning" size={24} color="#FF6B6B" />
            <Text style={modalStyles.title}>Confirmer la suppression</Text>
          </View>

          <View style={modalStyles.content}>
            <Text style={modalStyles.message}>
              Êtes-vous sûr de vouloir supprimer cette mission ?
            </Text>
            
            <View style={modalStyles.missionInfo}>
              <Text style={modalStyles.missionTitle}>{mission.titre}</Text>
              <Text style={modalStyles.missionDescription}>
                {mission.description}
              </Text>
            </View>

            <View style={modalStyles.warningBox}>
              <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
              <Text style={modalStyles.warningText}>
                Cette action est irréversible. Toutes les données associées à cette mission seront définitivement supprimées.
              </Text>
            </View>
          </View>

          <View style={modalStyles.buttonContainer}>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.cancelButton]}
              onPress={onCancel}
              disabled={isDeleting}
            >
              <Text style={modalStyles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[modalStyles.button, modalStyles.confirmButton]}
              onPress={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="trash" size={16} color="#FFF" />
                  <Text style={modalStyles.confirmButtonText}>Supprimer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
