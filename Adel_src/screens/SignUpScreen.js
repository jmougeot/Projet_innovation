// src/screens/SignUpScreen.js
import React, { useState } from "react";
import { View, TextInput, Button, Text, Picker } from "react-native-web";
import { signUpUser } from "../firebase/firebaseAuth";
import { addUser } from "../firebase/firebaseDatabase";

const SignUpScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("employee"); // Par défaut : salarié
  const [message, setMessage] = useState("");

  const handleSignUp = async () => {
    try {
      const user = await signUpUser(email, password);
      await addUser(user.uid, name, email, role); // Ajout du rôle dans Firestore
      setMessage("Inscription réussie !");
    } catch (error) {
      setMessage(`Erreur : ${error.message}`);
    }
  };

  return (
    <View>
      <Text>Inscription</Text>
      <TextInput placeholder="Nom" value={name} onChangeText={setName} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Picker
        selectedValue={role}
        onValueChange={(itemValue) => setRole(itemValue)}
      >
        <Picker.Item label="Salarié" value="employee" />
        <Picker.Item label="Gérant" value="manager" />
      </Picker>
      <Button title="S'inscrire" onPress={handleSignUp} />
      {message && <Text>{message}</Text>}
    </View>
  );
};

export default SignUpScreen;
