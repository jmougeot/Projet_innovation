'use client';

import React from "react";
import { View } from 'react-native';
import { db } from "../../firebase/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";
import MissionForm from "@/app/service/mission/MissionForm";
import "bootstrap/dist/css/bootstrap.min.css";
import Text from "@/app/components/Text";

interface MissionData {
  title: string;
  description: string;
  status: string;
}

export default function CreateMission() {
  const handleMissionSubmit = async (missionData: MissionData) => {
    const { title, description, status } = missionData;

    try {
      await addDoc(collection(db, "missions"), {
        title,
        description,
        status,
      });
    } catch (error) {
      console.error("Erreur lors de la création de la mission:", error);
    }
  };

  return (
      <View style={{ marginVertical: 16 }}>
        <Text>
          Créer une nouvelle mission
        </Text>
        <MissionForm onSubmit={handleMissionSubmit} />
      </View>
  );
}
