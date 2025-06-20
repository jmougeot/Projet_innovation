import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

interface MenuItem {
  label: string;
  onPress: () => void;
  isLogout?: boolean;
}

interface ReglageProps {
  menuItems?: MenuItem[];
  iconSource?: any; // Source for the settings icon
  iconSize?: number;
  position?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export default function Reglage({
  menuItems = [],
  iconSource,
  iconSize = 40,
  position = { top: Platform.OS === 'ios' ? 50 : 15, right: 15 }
}: ReglageProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const router = useRouter();

  // Alternative: Modal de confirmation custom pour le web
  const showCustomConfirmModal = (action: () => void) => {
    setConfirmAction(() => action);
    setConfirmModalVisible(true);
  };

  // Fonction d'alerte compatible web/mobile
  const showAlert = (title: string, message: string, buttons: Array<{text: string, onPress?: () => void, style?: 'cancel' | 'destructive' | 'default'}>) => {
    if (Platform.OS === 'web') {
      // Essayer d'abord confirm() natif, puis fallback modal custom
      console.log('🔔 [Web] Affichage alerte:', title, message);
      const confirmMessage = `${title}\n\n${message}`;
      
      try {
        const result = window.confirm(confirmMessage);
        console.log('🔔 [Web] Résultat alerte:', result);
        
        if (result) {
          // Trouver le bouton de confirmation (pas "Annuler")
          const confirmButton = buttons.find(btn => btn.style !== 'cancel' && btn.onPress);
          if (confirmButton?.onPress) {
            console.log('🔔 [Web] Exécution action confirmation');
            confirmButton.onPress();
          }
        }
      } catch (error) {
        console.error('❌ [Web] Erreur alerte, utilisation modal custom:', error);
        // Fallback: utiliser modal custom
        const confirmButton = buttons.find(btn => btn.style !== 'cancel' && btn.onPress);
        if (confirmButton?.onPress) {
          showCustomConfirmModal(confirmButton.onPress);
        }
      }
    } else {
      // Pour mobile, utiliser Alert natif
      Alert.alert(title, message, buttons);
    }
  };

  // Fonction de déconnexion Firebase
  const handleLogout = () => {
    setMenuVisible(false);
    showAlert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              console.log('✅ Déconnexion Firebase réussie');
              router.replace('/connexion' as any);
            } catch (error) {
              console.error('❌ Erreur déconnexion:', error);
              if (Platform.OS === 'web') {
                window.alert('Erreur: Impossible de se déconnecter');
              } else {
                Alert.alert('Erreur', 'Impossible de se déconnecter');
              }
            }
          }
        }
      ]
    );
  };

  // Default menu items if none provided
  const defaultMenuItems: MenuItem[] = [
    {
      label: 'Profil',
      onPress: () => {
        setMenuVisible(false);
        router.push('/Profil/avatar' as any);
      }
    },
    {
      label: 'Changer de restaurant',
      onPress: () => {
        setMenuVisible(false);
        router.push('/restaurant/select' as any);
      }
    },
    {
      label: 'Déconnexion',
      onPress: handleLogout,
      isLogout: true
    }
  ];

  const itemsToRender = menuItems.length > 0 ? menuItems : defaultMenuItems;

  // Define position styles for the container
  const positionStyles = {
    ...position,
    position: 'absolute' as 'absolute',
    zIndex: 15,
  };

  return (
    <View>
      <TouchableOpacity 
        style={[styles.logoContainer, positionStyles]} 
        onPress={() => setMenuVisible(!menuVisible)}
      >
        <Image 
          source={iconSource || require('../../assets/images/reglage.png')}
          style={[styles.logo, { width: iconSize, height: iconSize }]} 
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.dropdown, {
            top: (position.top || 0) + iconSize + 10,
            right: position.right || 15
          }]}>
            <View style={styles.dropdownContent}>
              {itemsToRender.map((item, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.menuItem, 
                    index === itemsToRender.length - 1 && styles.lastMenuItem,
                    item.isLogout && styles.logoutItem
                  ]}
                  onPress={item.onPress}
                >
                  <Text style={[
                    styles.menuItemText, 
                    item.isLogout && styles.logoutText
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: 40,
    height: 40,
  },
  logo: {
    borderRadius: 20,
    backgroundColor: '#CAE1EF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  dropdownContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
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
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: '#194A8D',
  },
  logoutItem: {
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    color: '#D32F2F',
  },
});
