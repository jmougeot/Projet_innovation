import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import {Link, useRouter} from "expo-router";
import { signInUser, auth } from "./firebase/firebaseAuth";
import { getFirestore, doc, getDoc, Firestore } from "firebase/firestore";
import { db } from "./firebase/firebaseConfig";

interface UserData {
  role: "manager" | "employee";
}

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const router = useRouter();

  const handleLogin = async (): Promise<void> => {
    try {
      if (!email || !password) {
        setMessage("Veuillez remplir tous les champs");
        return;
      }

      const user = await signInUser(email, password);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data() as UserData;

      if (userData?.role === "manager") {
        router.push('./service/plan_de_salle');
      } else if (userData?.role === "employee") {
        router.push("./service/plan_de_salle");
      } else {
        setMessage("Rôle utilisateur non reconnu");
      }
    } catch (error: any) {
      let errorMessage = "Une erreur est survenue";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "Utilisateur non trouvé";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Mot de passe incorrect";
      }
      setMessage(errorMessage);
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

      <Link href="./SignUpScreen">
        <Text>S'inscrire</Text>
      </Link>
    </View>
  );
};

export default LoginScreen;