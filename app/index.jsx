import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from 'expo-font';
import Reglage from './components/reglage';
import Head from './components/Head';

export default function Index() {
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../assets/fonts/AlexBrush-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Use the reusable Reglage component */}
      <Reglage 
        // Optional: pass custom menu items
        // menuItems={customMenuItems}
        // Optional: customize position
        position={{ top: 5, right: 15 }}
        // Optional: custom icon
        // iconSource={require('../assets/images/custom-icon.png')}
      />

      <Head title="Le Challenge" />

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
          <Link href="./service" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Service</Text>
            </Pressable>
          </Link>
          
          <Link href="./cuisine" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Cuisine</Text>
            </Pressable>
          </Link>

          <Link href="./connexion/connexion" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Login</Text>
            </Pressable>
          </Link>

          <Link href="./manageur/home" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Gestion</Text>
            </Pressable>
          </Link>

          <Link href="./mission" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Mission</Text>
            </Pressable>
          </Link>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>© Le Challenge</Text>
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
  // Logo styles
  logoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 15,
    right: 15,
    zIndex: 15,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CAE1EF', // Temporary background if logo has transparency
  },
  // Dropdown menu styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 60,
    right: 15,
    backgroundColor: 'transparent',
  },
  dropdownContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 180,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  menuItemText: {
    fontSize: 16,
    color: '#194A8D',
  },
  logoutItem: {
    borderBottomWidth: 0,
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    color: '#D32F2F',
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
