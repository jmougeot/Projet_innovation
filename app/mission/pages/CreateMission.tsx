import React from "react";
import { db } from "../../firebase/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";
import MissionForm from "../components/MissionForm"; // Importation du composant MissionForm
import "bootstrap/dist/css/bootstrap.min.css";
import "./CreateMission.css";

// Définir le type des données de la mission que nous allons soumettre
interface MissionData {
  title: string;
  description: string;
  status: "à faire" | "en cours" | "fait"; // Liste des statuts possibles
}

const CreateMission: React.FC = () => {
  const handleMissionSubmit = async (missionData: MissionData) => {
    const { title, description, status } = missionData;

    // Ajouter la mission dans Firestore
    await addDoc(collection(db, "missions"), {
      title,
      description,
      status,
    });
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Créer une nouvelle mission</h2>
      <MissionForm onSubmit={handleMissionSubmit} />
    </div>
  );
}

export default CreateMission;
