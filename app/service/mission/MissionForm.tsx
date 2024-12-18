import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, Pressable } from "react-native";
import { Picker } from "@react-native-picker/picker";

interface MissionFormProps {
  onSubmit: (data: { title: string; description: string; status: string }) => Promise<void>;
}

const MissionForm: React.FC<MissionFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("à faire");

  const handleSubmit = () => {
    onSubmit({ title, description, status });
    setTitle("");
    setDescription("");
    setStatus("à faire");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Titre</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Titre de la mission"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        placeholder="Description de la mission"
      />

      <Text style={styles.label}>État</Text>
      <Picker
        selectedValue={status}
        onValueChange={(itemValue) => setStatus(itemValue)}
      >
        <Picker.Item label="À faire" value="à faire" />
        <Picker.Item label="En cours" value="en cours" />
        <Picker.Item label="Terminé" value="terminé" />
      </Picker>

      <Pressable style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Créer la mission</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  textArea: {
    height: 100,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  }
});

export default MissionForm;
