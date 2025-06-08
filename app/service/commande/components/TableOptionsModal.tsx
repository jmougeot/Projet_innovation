import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface TableOptionsModalProps {
  visible: boolean;
  tableName: string;
  onDelete: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

export default function TableOptionsModal({
  visible,
  tableName,
  onDelete,
  onEdit,
  onCancel
}: TableOptionsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <MaterialIcons name="table-restaurant" size={24} color="#194A8D" />
            <Text style={styles.title}>Options - {tableName}</Text>
          </View>
          
          <Text style={styles.message}>Que souhaitez-vous faire avec cette table ?</Text>
          
          <View style={styles.buttons}>
            <Pressable style={styles.editButton} onPress={onEdit}>
              <MaterialIcons name="edit" size={20} color="#fff" />
              <Text style={styles.editButtonText}>Modifier</Text>
            </Pressable>
            
            <Pressable style={styles.deleteButton} onPress={onDelete}>
              <MaterialIcons name="delete" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Supprimer tout</Text>
            </Pressable>
          </View>
          
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    minWidth: 300,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#194A8D',
    marginLeft: 10,
    flex: 1,
  },
  message: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 15,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#194A8D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#DC3545',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
