import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

interface ErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  showRetryButton?: boolean;
  showBackButton?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export default function ErrorScreen({
  title = "Une erreur s'est produite",
  message = "Quelque chose ne s'est pas passé comme prévu. Veuillez réessayer.",
  onRetry,
  onGoBack,
  showRetryButton = true,
  showBackButton = true,
  icon = "error-outline"
}: ErrorScreenProps) {
  
  return (
    <LinearGradient
      colors={['#1e3c72', '#2a5298', '#3b6fb0']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <MaterialIcons name={icon} size={64} color="white" />
        </View>
        
        {/* Error Text */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {showRetryButton && onRetry && (
            <Pressable style={styles.primaryButton} onPress={onRetry}>
              <LinearGradient
                colors={['#ff6b6b', '#ee5a24']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="refresh" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Réessayer</Text>
              </LinearGradient>
            </Pressable>
          )}
          
          {showBackButton && onGoBack && (
            <Pressable style={styles.secondaryButton} onPress={onGoBack}>
              <View style={styles.secondaryButtonContent}>
                <MaterialIcons name="arrow-back" size={20} color="white" />
                <Text style={styles.secondaryButtonText}>Retour</Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontWeight: '300',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '100%',
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
