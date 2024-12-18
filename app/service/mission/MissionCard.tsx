import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import ModifierEtat from './ModifierEtat'; // Importation du composant ModifierEtat
import ProgressBar from './ProgressBar';

// Définition des types pour les props du composant MissionCard
interface MissionCardProps {
  id: string;
  title: string;
  description: string;
  status: string; // Changé de state à status
  onStateChange: (id: string, newStatus: string) => Promise<void>; // Ajout du type Promise<void>
  onDelete: (id: string) => Promise<void>; // Ajout du type Promise<void>
}

const MissionCard: React.FC<MissionCardProps> = ({ 
  id, 
  title, 
  description, 
  status, // Changé de state à status
  onStateChange, 
  onDelete 
}) => {
  const [showDialog, setShowDialog] = useState<boolean>(false); // État pour gérer l'affichage de la modale

  const handleStateChange = () => {
    setShowDialog(true); // Afficher la modale lorsque l'utilisateur clique sur "Modifier l'état"
  };

  const handleCloseDialog = () => {
    setShowDialog(false); // Fermer la modale sans faire de modification
  };

  const handleSelectState = (newStatus: string) => {
    onStateChange(id, newStatus); // Mettre à jour l'état de la mission via la fonction passée en props
    setShowDialog(false); // Fermer la modale après avoir sélectionné l'état
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer la mission "${title}" ?`);
    if (confirmDelete) {
      onDelete(id); // Appeler la fonction onDelete pour supprimer la mission si l'utilisateur confirme
      alert('Mission supprimée avec succès !'); // Afficher un message de confirmation après la suppression
    }
  };

  // Fonction pour transformer l'état en une valeur numérique pour ProgressBar
  const transformStatus = (currentStatus: string): number => {
    const statusMapping: Record<string, number> = {
      "à faire": 0,
      "en cours": 1,
      "fait": 2,
    };

    return statusMapping[currentStatus] !== undefined ? statusMapping[currentStatus] : 0;
  };

  return (
    <View
      style={{
        width: 300,
        padding: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        backgroundColor: '#fff',
        marginBottom: 20,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>{title}</Text>
      <Text style={{ marginBottom: 20 }}>Description : {description}</Text>

      <ProgressBar state={transformStatus(status)} />

      <TouchableOpacity
        onPress={handleStateChange}
        style={{
          marginTop: 20,
          padding: 10,
          backgroundColor: '#3b82f6',
          borderRadius: 5,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white' }}>Modifier l'état</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleDelete}
        style={{
          marginTop: 10,
          padding: 10,
          backgroundColor: 'red',
          borderRadius: 5,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white' }}>Supprimer la mission</Text>
      </TouchableOpacity>

      <ModifierEtat
        show={showDialog}
        onClose={handleCloseDialog}
        onSelectState={handleSelectState}
        title={title}
      />
    </View>
  );
};

export default MissionCard;
