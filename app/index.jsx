import { View, Text, StyleSheet, Pressable, SafeAreaView, Image } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';

// Define fonts outside component to ensure stable reference
const FONT_CONFIG = {
  'AlexBrush': require('../assets/fonts/AlexBrush-Regular.ttf'),
  'GreatVibes': require('../assets/fonts/GreatVibes-Regular.ttf'),
};

export default function Index() {
  const router = useRouter();
  
  // Use array destructuring with stable variable names
  const fontLoadResult = useFonts(FONT_CONFIG);
  const fontsLoaded = fontLoadResult[0];
  const fontError = fontLoadResult[1];

  const handleLogin = React.useCallback(() => {
    try {
      if (router?.push) {
        router.push('/connexion');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [router]);

  // Show loading if fonts haven't loaded yet
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1e3c72', '#2a5298', '#3b6fb0']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/logo_valide.jpg')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          {/* Title */}
          <Text style={styles.appTitle}>Le Challenge</Text>
          <Text style={styles.appSubtitle}>Gestion de Restaurant</Text>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Bienvenue</Text>
          <Text style={styles.welcomeSubtext}>
            Connectez-vous pour accéder à votre espace de gestion
          </Text>
        </View>

        {/* Login Button */}
        <View style={styles.loginSection}>
          <Pressable style={styles.loginButton} onPress={handleLogin}>
            <LinearGradient
              colors={['#ff6b6b', '#ee5a24']}
              style={styles.loginButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="login" size={24} color="white" />
              <Text style={styles.loginButtonText}>Se connecter</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Le Challenge Restaurant
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 50,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    boxShadow: '0px 8px 10px rgba(0,0,0,0.3)',
    elevation: 15,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  appTitle: {
    fontSize: 36,
    fontFamily: 'AlexBrush',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
    textShadow: '2px 2px 5px rgba(0,0,0,0.3)',
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 1,
  },
  welcomeSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 42,
    fontFamily: 'GreatVibes',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    textShadow: '2px 2px 5px rgba(0,0,0,0.3)',
  },
  welcomeSubtext: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontWeight: '300',
  },
  loginSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  loginButton: {
    width: '80%',
    height: 55,
    borderRadius: 30,
    boxShadow: '0px 6px 8px rgba(0,0,0,0.3)',
    elevation: 10,
  },
  loginButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    gap: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e3c72',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
