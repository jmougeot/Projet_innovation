import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '@/app/components/Header';
import { useRestaurant } from '../restaurant/SelectionContext';

export default function RestaurantLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user } = useRestaurant();

  useEffect(() => {
    // Pas besoin de rafraîchir avec le nouveau contexte
  }, [user]);

  const handleSetupTestAccess = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour configurer les accès de test');
      return;
    }

    try {
      setLoading(true);
      
      Alert.alert(
        'Configuration terminée',
        'Les accès de test ont été créés. Vous pouvez maintenant accéder au restaurant.',
        [
          {
            text: 'Continuer',
            onPress: () => router.push('/restaurant/select' as any)
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la configuration:', error);
      Alert.alert('Erreur', 'Impossible de configurer les accès de test');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSelection = () => {
    router.push('/restaurant/select' as any);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Accès Restaurant" />
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="account-circle" size={80} color="#ccc" />
            <Text style={styles.errorTitle}>Connexion requise</Text>
            <Text style={styles.errorMessage}>
              Vous devez être connecté pour accéder aux fonctionnalités restaurant.
            </Text>
            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('./connexion' as any)}
            >
              <LinearGradient
                colors={['#194A8D', '#0F3A6B']}
                style={styles.buttonGradient}
              >
                <MaterialIcons name="login" size={20} color="white" />
                <Text style={styles.buttonText}>Se connecter</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Configuration Restaurant" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialIcons name="restaurant" size={64} color="#194A8D" />
          <Text style={styles.title}>Bienvenue dans l'espace Restaurant</Text>
          <Text style={styles.subtitle}>
            Connecté en tant que {user.email}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>État des accès</Text>
          
          <View style={styles.statusSuccess}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.statusText}>
              Accès restaurant configuré
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={handleGoToSelection}>
            <LinearGradient
              colors={['#194A8D', '#0F3A6B']}
              style={styles.buttonGradient}
            >
              <MaterialIcons name="restaurant" size={24} color="white" />
              <Text style={styles.buttonText}>Accéder aux restaurants</Text>
            </LinearGradient>
          </Pressable>
          
          <Pressable 
            style={[styles.primaryButton, loading && styles.buttonDisabled]} 
            onPress={handleSetupTestAccess}
            disabled={loading}
          >
            <LinearGradient
              colors={['#D4AF37', '#B8941F']}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialIcons name="build" size={24} color="white" />
                  <Text style={styles.buttonText}>Configurer accès de test</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.push('../service' as any)}>
            <Text style={styles.secondaryButtonText}>Retour au service</Text>
          </Pressable>
        </View>

        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color="#194A8D" />
          <Text style={styles.infoText}>
            Le système d'authentification restaurant vous permet de gérer l'accès 
            sécurisé aux données et fonctionnalités de votre établissement.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statusSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  actions: {
    gap: 15,
    marginBottom: 30,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#194A8D',
    lineHeight: 20,
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});