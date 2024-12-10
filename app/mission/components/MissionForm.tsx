import React, { useState, ChangeEvent, FormEvent } from "react";

// Définition des types pour les props
interface MissionFormProps {
  onSubmit: (data: { title: string; description: string; status: string }) => void; // Fonction pour soumettre les données du formulaire
}

const MissionForm: React.FC<MissionFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState<string>(""); // Titre de la mission
  const [description, setDescription] = useState<string>(""); // Description de la mission
  const [status, setStatus] = useState<string>("à faire"); // État de la mission (par défaut "à faire")

  // Fonction de gestion de la soumission du formulaire
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Appeler la fonction onSubmit passée en props avec les données du formulaire
    onSubmit({ title, description, status });

    // Réinitialiser le formulaire après soumission
    setTitle("");
    setDescription("");
    setStatus("à faire");
  };

  // Fonction de gestion des changements de titre
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  // Fonction de gestion des changements de description
  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  // Fonction de gestion des changements d'état
  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="shadow p-4 rounded bg-light">
      {/* Champ Titre */}
      <div className="mb-3">
        <label htmlFor="title" className="form-label">Titre de la mission</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={handleTitleChange}
          className="form-control"
          placeholder="Entrez le titre de la mission"
          required
        />
      </div>

      {/* Champ Description */}
      <div className="mb-3">
        <label htmlFor="description" className="form-label">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={handleDescriptionChange}
          className="form-control"
          placeholder="Entrez la description de la mission"
          required
        />
      </div>

      {/* Champ État */}
      <div className="mb-3">
        <label htmlFor="status" className="form-label">État de la mission</label>
        <select
          id="status"
          value={status}
          onChange={handleStatusChange}
          className="form-select"
          required
        >
          <option value="à faire">À faire</option>
          <option value="en cours">En cours</option>
          <option value="fait">Fait</option>
        </select>
      </div>

      <button type="submit" className="btn btn-success btn-lg w-100">
        Créer la mission
      </button>
    </form>
  );
};

export default MissionForm;
