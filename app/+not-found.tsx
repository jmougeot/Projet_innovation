import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

export default function NotFoundScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../assets/fonts/AlexBrush-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleGoHome = () => {
    router.replace('/home');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <LinearGradient
      colors={['#1e3c72', '#2a5298', '#3b6fb0']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Error Icon */}
        <View style={styles.errorSection}>
          <View style={styles.errorIconContainer}>
            <MaterialIcons name="error-outline" size={80} color="white" />
          </View>
          
          <Text style={styles.errorCode}>404</Text>
          <Text style={styles.errorTitle}>Page non trouvée</Text>
          <Text style={styles.errorMessage}>
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </Text>
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/logo_valide.jpg')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appTitle}>Le Challenge</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Pressable style={styles.primaryButton} onPress={handleGoHome}>
            <LinearGradient
              colors={['#ff6b6b', '#ee5a24']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="home" size={24} color="white" />
              <Text style={styles.primaryButtonText}>Retour à l'accueil</Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleGoBack}>
            <View style={styles.secondaryButtonContent}>
              <MaterialIcons name="arrow-back" size={24} color="white" />
              <Text style={styles.secondaryButtonText}>Page précédente</Text>
            </View>
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
  errorSection: {
    alignItems: 'center',
    marginTop: 30,
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  errorCode: {
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  errorMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontWeight: '300',
  },
  logoSection: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  appTitle: {
    fontSize: 24,
    fontFamily: 'AlexBrush',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  primaryButton: {
    width: '85%',
    height: 55,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    gap: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '85%',
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '300',
  },
});
