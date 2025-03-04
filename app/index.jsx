import { View, Text, StyleSheet, Image, Pressable, SafeAreaView, Platform } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from 'expo-font';

export default function Index() {
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../assets/fonts/AlexBrush-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSquare}>
        <Text style={styles.headerSquareText}>Le Challenge</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Bienvenue</Text>
          <LinearGradient
            colors={['transparent', '#CAE1EF', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.separator}
          />
          <Text style={styles.welcomeText}>Sélectionnez une option pour continuer</Text>
        </View>
        
        <View style={styles.buttonsSection}>
          <Link href="./service/(tabs)/plan_de_salle" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Service</Text>
            </Pressable>
          </Link>

          <Link href="./service/commande/change_plan" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Modifier le Plan</Text>
            </Pressable>
          </Link>

          <Link href="./cuisine/cuisine" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Cuisine</Text>
            </Pressable>
          </Link>

          <Link href="./connexion" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Login</Text>
            </Pressable>
          </Link>

          <Link href="./manageur/home" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Gestion</Text>
            </Pressable>
          </Link>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2023 Le Challenge</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#194A8D',
  },
  headerSquare: {
    alignSelf: 'center',
    backgroundColor: '#CAE1EF',
    width: 200,
    height: 35,
    marginBottom: 20,
    borderRadius: 80,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        marginTop: 45,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerSquareText: {
    color: '#083F8C',
    fontWeight: 'bold',
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 15,
    justifyContent: 'space-between',
  },
  welcomeSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    color: '#194A8D',
    marginBottom: 10,
    fontFamily: 'AlexBrush',
    letterSpacing: 1,
  },
  separator: {
    height: 4,
    width: '80%',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#194A8D',
    textAlign: 'center',
  },
  buttonsSection: {
    width: '100%',
    gap: 15,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#CAE1EF',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  specialButton: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowColor: 'transparent',
    overflow: 'hidden',
    padding: 0,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: '#083F8C',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 15,
    alignItems: 'center',
  },
  footerText: {
    color: '#CAE1EF',
    fontSize: 14,
  }
});
