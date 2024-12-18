import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Définition des types des props pour ModifierEtat
interface ModifierEtatProps {
  show: boolean; // Détermine si la modale est visible
  onClose: () => void; // Fonction pour fermer la modale
  onSelectState: (newState: string) => void; // Fonction pour sélectionner un nouvel état
  title: string; // Titre de la mission
}

const ModifierEtat: React.FC<ModifierEtatProps> = ({ show, onClose, onSelectState, title }) => {
  if (!show) return null; // Si la modale ne doit pas être affichée, retourner null

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.header}>Modifier l'état de la mission</Text>
        <Text>{title}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => onSelectState('à faire')}
            style={styles.todoButton}
          >
            <Text>À faire</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSelectState('en cours')}
            style={styles.inProgressButton}
          >
            <Text style={{ color: 'white' }}>En cours</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSelectState('fait')}
            style={styles.doneButton}
          >
            <Text style={{ color: 'white' }}>Fait</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onClose}
          style={styles.cancelButton}
        >
          <Text style={{ color: 'white' }}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 20,
  },
  todoButton: {
    margin: 5,
    padding: 10,
    backgroundColor: '#facc15',
    borderRadius: 5,
    alignItems: 'center',
  },
  inProgressButton: {
    margin: 5,
    padding: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 5,
    alignItems: 'center',
  },
  doneButton: {
    margin: 5,
    padding: 10,
    backgroundColor: '#10b981',
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#9ca3af',
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
});

export default ModifierEtat;
