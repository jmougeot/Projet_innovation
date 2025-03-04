// src/screens/SignUpScreen.js
import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, Pressable, Platform, ScrollView } from "react-native";
import { signUpUser } from "./firebase/firebaseAuth";
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { Link, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";

const SignUpScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("employee");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../assets/fonts/AlexBrush-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleSignUp = async () => {
    try {
      if (!email || !password || !name) {
        setMessage("Veuillez remplir tous les champs");
        return;
      }

      await signUpUser(email, password, name, role);
      setMessage("Inscription réussie !");
      // Redirect to login after successful signup
      setTimeout(() => {
        router.push('./connexion');
      }, 1500);
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`Erreur : ${error.message}`);
      } else {
        setMessage("Erreur inconnue");
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#194A8D', '#0A2E5C']}
        style={styles.background}
      />
      
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Le Challenge</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>Inscription</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez votre nom"
              placeholderTextColor="#AAA"
              value={name}
              onChangeText={setName}
            />
          </View>
          
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
              placeholder="Créez votre mot de passe"
              placeholderTextColor="#AAA"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Rôle</Text>
            <Pressable 
              style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              onPress={() => {
                // Toggle role
                const newRole = role === "employee" ? "manager" : "employee";
                console.log("Changing role to:", newRole);
                setRole(newRole);
              }}
            >
              <Text style={{ color: '#194A8D' }}>
                {role === "employee" ? "Salarié" : "Gérant"}
              </Text>
              <Text>▼</Text>
            </Pressable>
          </View>
          
          {message ? <Text style={[styles.message, message.includes("réussie") ? styles.successMessage : styles.errorMessage]}>{message}</Text> : null}
          
          <Pressable style={styles.signupButton} onPress={handleSignUp}>
            <LinearGradient
              colors={['#CAE1EF', '#8BBAD7']}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>S'INSCRIRE</Text>
            </LinearGradient>
          </Pressable>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Déjà un compte? </Text>
            <Link href="./connexion">
              <Text style={styles.loginLink}>Se connecter</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    marginBottom: 25,
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
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#194A8D',
    marginBottom: 5,
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
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    borderColor: '#CAE1EF',
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#194A8D',
  },
  signupButton: {
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
  message: {
    textAlign: 'center',
    marginTop: 10,
  },
  errorMessage: {
    color: '#FF3B30',
  },
  successMessage: {
    color: '#4CD964',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#194A8D',
    fontWeight: 'bold',
  },
});

export default SignUpScreen;