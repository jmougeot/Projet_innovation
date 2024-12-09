import React from 'react';

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
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '300px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2>Modifier l'état de la mission</h2>
        <p>{title}</p>

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => onSelectState('à faire')}
            style={{
              margin: '5px',
              padding: '10px 20px',
              backgroundColor: '#facc15',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            À faire
          </button>
          <button
            onClick={() => onSelectState('en cours')}
            style={{
              margin: '5px',
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            En cours
          </button>
          <button
            onClick={() => onSelectState('fait')}
            style={{
              margin: '5px',
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Fait
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            backgroundColor: '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'block',
            width: '100%',
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default ModifierEtat;
