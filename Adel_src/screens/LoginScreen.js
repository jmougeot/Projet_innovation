import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native-web";
import { signInUser } from "../firebase/firebaseAuth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import app from "../firebase/firebaseConfig";

const db = getFirestore(app);

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    try {
      const user = await signInUser(email, password);

      // Récupérez les informations de rôle de l'utilisateur
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (userData.role === "manager") {
        navigation.navigate("ManagerDashboard"); // Redirigez vers l'interface gérant
      } else if (userData.role === "employee") {
        navigation.navigate("EmployeeDashboard"); // Redirigez vers l'interface salarié
      }
    } catch (error) {
      setMessage(`Erreur : ${error.message}`);
    }
  };

  return (
    <View>
      <Text>Connexion</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Se connecter" onPress={handleLogin} />
      {message && <Text>{message}</Text>}
    </View>
  );
};

export default LoginScreen;
