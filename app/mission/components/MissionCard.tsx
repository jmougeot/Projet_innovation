import React, { useState } from 'react';
import ModifierEtat from './ModifierEtat'; // Importation du composant ModifierEtat
import ProgressBar from './ProgressBar';

// Définition des types pour les props du composant MissionCard
interface MissionCardProps {
  title: string;
  description: string;
  state: string; // État actuel de la mission ("à faire", "en cours", "fait")
  id: number; // Identifiant unique de la mission
  onStateChange: (id: number, newState: string) => void; // Callback pour changer l'état de la mission
  onDelete: (id: number) => void; // Callback pour supprimer la mission
}

const MissionCard: React.FC<MissionCardProps> = ({ 
  title, 
  description, 
  state, 
  id, 
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

  const handleSelectState = (newState: string) => {
    onStateChange(id, newState); // Mettre à jour l'état de la mission via la fonction passée en props
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
  const transformStatus = (status: string): number | null => {
    const statusMapping: Record<string, number> = {
      "à faire": 0,
      "en cours": 1,
      "fait": 2,
    };

    return statusMapping[status] !== undefined ? statusMapping[status] : null;
  };

  return (
    <div
      style={{
        width: '300px',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fff',
        marginBottom: '20px',
      }}
    >
      <h3 style={{ marginBottom: '10px' }}>{title}</h3>
      <p style={{ marginBottom: '20px' }}>Déscription : {description}</p>

      {/* Composant ProgressBar utilisé ici */}
      <ProgressBar state={transformStatus(state)} />

      {/* Bouton pour changer l'état de la mission */}
      <button
        onClick={handleStateChange}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Modifier l'état
      </button>

      {/* Bouton pour supprimer la mission */}
      <button
        onClick={handleDelete}
        style={{
          marginTop: '10px',
          padding: '10px 20px',
          backgroundColor: 'red',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Supprimer la mission
      </button>

      {/* Modale de confirmation */}
      <ModifierEtat
        show={showDialog}
        onClose={handleCloseDialog}
        onSelectState={handleSelectState}
        title={title} // Passer le titre de la mission à la modale
      />
    </div>
  );
};

export default MissionCard;
