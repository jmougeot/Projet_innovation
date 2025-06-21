/**
 * 🚪 Composant Déconnexion Personnalisé
 * 
 * FONCTIONNALITÉS:
 * - ✅ Compatible Web/Mobile (remplace Alert.alert)
 * - 🎨 Design cohérent avec l'app
 * - ⚡ Animations fluides
 * - 🔒 Confirmation de sécurité
 * - 📱 Responsive design
 * - 🔧 Réutilisable pour d'autres confirmations
 * 
 * UTILISATION:
 * ```tsx
 * import Deconnexion, { useDeconnexion } from '@/app/components/Deconnexion';
 * 
 * const { isVisible, showDialog, hideDialog } = useDeconnexion();
 * 
 * <Deconnexion
 *   visible={isVisible}
 *   onClose={hideDialog}
 *   onConfirm={async () => await signOut(auth)}
 * />
 * ```
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface DeconnexionProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  type?: 'logout' | 'delete' | 'warning' | 'info';
}

const { width: screenWidth } = Dimensions.get('window');

// 🎨 Configuration des types d'alerte
const alertConfig = {
  logout: {
    icon: 'logout' as keyof typeof MaterialIcons.glyphMap,
    gradientColors: ['#E53E3E', '#C53030'],
    iconBackgroundColor: 'rgba(228, 62, 62, 0.1)',
    iconBorderColor: 'rgba(228, 62, 62, 0.2)',
  },
  delete: {
    icon: 'delete' as keyof typeof MaterialIcons.glyphMap,
    gradientColors: ['#E53E3E', '#C53030'],
    iconBackgroundColor: 'rgba(228, 62, 62, 0.1)',
    iconBorderColor: 'rgba(228, 62, 62, 0.2)',
  },
  warning: {
    icon: 'warning' as keyof typeof MaterialIcons.glyphMap,
    gradientColors: ['#FF9800', '#F57C00'],
    iconBackgroundColor: 'rgba(255, 152, 0, 0.1)',
    iconBorderColor: 'rgba(255, 152, 0, 0.2)',
  },
  info: {
    icon: 'info' as keyof typeof MaterialIcons.glyphMap,
    gradientColors: ['#194A8D', '#0F3A7A'],
    iconBackgroundColor: 'rgba(25, 74, 141, 0.1)',
    iconBorderColor: 'rgba(25, 74, 141, 0.2)',
  },
};

export default function Deconnexion({
  visible,
  onClose,
  onConfirm,
  title = 'Déconnexion',
  message = 'Voulez-vous vraiment vous déconnecter ?',
  confirmText = 'Déconnexion',
  cancelText = 'Annuler',
  iconName,
  type = 'logout'
}: DeconnexionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  // 🎨 Configuration basée sur le type
  const config = alertConfig[type];
  const finalIcon = iconName || config.icon;

  React.useEffect(() => {
    if (visible) {
      // Animation d'entrée
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
    } catch (error) {
      console.error('❌ Erreur lors de la confirmation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleBackdropPress = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleCancel}
      statusBarTranslucent={true}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <Pressable 
          style={styles.backdrop} 
          onPress={handleBackdropPress}
        />
        
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            }
          ]}
        >
          {/* 🎨 En-tête avec icône */}
          <View style={styles.header}>
            <View style={[
              styles.iconContainer,
              {
                backgroundColor: config.iconBackgroundColor,
                borderColor: config.iconBorderColor,
              }
            ]}>
              <MaterialIcons name={finalIcon} size={28} color="#194A8D" />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* 📝 Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* 🎛️ Boutons d'action */}
          <View style={styles.actionsContainer}>
            <Pressable 
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </Pressable>

            <Pressable 
              style={[styles.button, styles.confirmButton, isLoading && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#9E9E9E', '#757575'] : (config.gradientColors as [string, string])}
                style={styles.confirmButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialIcons name={finalIcon} size={18} color="white" />
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 🎨 Layout principal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    padding: 25,
    width: Math.min(screenWidth - 40, 420),
    maxWidth: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.3)',
      },
      default: {
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
      },
    }),
    borderWidth: 1,
    borderColor: '#CAE1EF',
  },

  // 🎨 En-tête
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#194A8D',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // 📝 Message
  messageContainer: {
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },

  // 🎛️ Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  // 🚫 Bouton annuler
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#CAE1EF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#194A8D',
  },

  // ✅ Bouton confirmer
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

// 🔧 Hook personnalisé pour faciliter l'utilisation
export function useDeconnexion() {
  const [isVisible, setIsVisible] = useState(false);

  const showDialog = () => setIsVisible(true);
  const hideDialog = () => setIsVisible(false);

  return {
    isVisible,
    showDialog,
    hideDialog,
  };
}

// 🚀 Hook avancé avec configuration
export function useConfirmDialog() {
  const [isVisible, setIsVisible] = useState(false);
  const [config, setConfig] = useState<Partial<DeconnexionProps>>({});

  const showDialog = (dialogConfig: Partial<DeconnexionProps>) => {
    setConfig(dialogConfig);
    setIsVisible(true);
  };

  const hideDialog = () => {
    setIsVisible(false);
    setConfig({});
  };

  return {
    isVisible,
    config,
    showDialog,
    hideDialog,
  };
}
