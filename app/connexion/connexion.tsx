import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, Pressable, Platform, Image } from "react-native";
import { Link, useRouter } from "expo-router";
import { signInUser } from "../firebase/firebaseAuth";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';

interface UserData {
  role: "manager" | "employee";
}

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../assets/fonts/AlexBrush-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleLogin = async (): Promise<void> => {
    try {
      if (!email || !password) {
        setMessage("Veuillez remplir tous les champs");
        return;
      }

      const user = await signInUser({ email, password });
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data() as UserData;

      if (userData?.role === "manager") {
        router.replace("/" as any);  // Use absolute path instead of relative;
      } else if (userData?.role === "employee") {
        router.replace("/" as any);  // Use absolute path instead of relative;
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#194A8D', '#0A2E5C']}
        style={styles.background}
      />
      
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>RestaurantApp</Text>
      </View>
      
      <View style={styles.formContainer}>
        <Text style={styles.title}>Connexion</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Entrez votre email"
            placeholderTextColor="#AAA"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Entrez votre mot de passe"
            placeholderTextColor="#AAA"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
        
        {message ? <Text style={styles.errorMessage}>{message}</Text> : null}
        
        <Pressable style={styles.loginButton} onPress={handleLogin}>
          <LinearGradient
            colors={['#CAE1EF', '#8BBAD7']}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>SE CONNECTER</Text>
          </LinearGradient>
        </Pressable>
        
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Pas encore de compte? </Text>
          <Link href="./inscription">
            <Text style={styles.registerLink}>S'inscrire</Text>
          </Link>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 42,
    fontFamily: 'AlexBrush',
    color: 'white',
    letterSpacing: 1,
  },
  formContainer: {
    width: '85%',
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    padding: 25,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#194A8D',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#194A8D',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    borderColor: '#CAE1EF',
    borderWidth: 1,
    color: '#194A8D',
  },
  loginButton: {
    width: '100%',
    height: 50,
    marginTop: 15,
    borderRadius: 25,
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  buttonText: {
    color: '#083F8C',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorMessage: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 10,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
  },
  registerLink: {
    color: '#194A8D',
    fontWeight: 'bold',
  },
});

export default LoginScreen;