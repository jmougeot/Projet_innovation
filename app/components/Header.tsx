import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Head from './Head';
import Reglage from './reglage';

interface MenuItem {
  label: string;
  onPress: () => void;
  isLogout?: boolean;
}

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
  backgroundColor?: string;
  textColor?: string;
  useHeadComponent?: boolean; // Nouvelle prop pour choisir d'utiliser Head ou non
  customBackRoute?: string; // Nouvelle prop pour spécifier une route de retour personnalisée
  showReglage?: boolean; // Nouvelle prop pour afficher le composant réglage
  reglageMenuItems?: MenuItem[]; // Menu items personnalisés pour réglage
}

const Header = ({ 
  title, 
  showBackButton = true, 
  onBackPress,
  rightAction,
  backgroundColor = 'transparent',
  textColor = '#FFFFFF',
  useHeadComponent = false,
  customBackRoute,
  showReglage = false,
  reglageMenuItems = []
}: HeaderProps) => {
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (customBackRoute) {
      // Si une route personnalisée est spécifiée, l'utiliser
      router.replace(customBackRoute as any);
    } else {
      // Vérifier s'il y a un écran précédent avant d'appeler router.back()
      if (router.canGoBack()) {
        router.back();
      } else {
        // Si pas d'écran précédent, rediriger vers la page d'accueil
        router.replace('/');
      }
    }
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor,
          paddingTop: Platform.OS === 'ios' ? 0 : insets.top,
        }
      ]}
    >
      <StatusBar barStyle="light-content" />
      
      {useHeadComponent ? (
        <View style={styles.headComponentContainer}>
          <View style={styles.navigationRow}>
            {showBackButton && (
              <Pressable 
                style={styles.backButton}
                onPress={handleBackPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="arrow-back" size={24} color={textColor} />
              </Pressable>
            )}
            
            <View style={styles.rightActions}>
              {rightAction && (
                <Pressable 
                  style={[styles.rightAction, { marginRight: showReglage ? 8 : 0 }]}
                  onPress={rightAction.onPress}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {rightAction.icon}
                </Pressable>
              )}
              
              {showReglage && (
                <View style={styles.reglageContainer}>
                  <Reglage
                    menuItems={reglageMenuItems}
                    iconSize={28}
                    position={{ top: 0, right: 0 }}
                  />
                </View>
              )}
            </View>
          </View>
          
          <Head title={title} />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {showBackButton && (
            <Pressable 
              style={styles.backButton}
              onPress={handleBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="arrow-back" size={24} color={textColor} />
            </Pressable>
          )}
          
          <Text 
            style={[styles.title, { color: textColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          
          <View style={styles.rightActions}>
            {rightAction && (
              <Pressable 
                style={[styles.rightAction, { marginRight: showReglage ? 8 : 0 }]}
                onPress={rightAction.onPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {rightAction.icon}
              </Pressable>
            )}
            
            {showReglage && (
              <View style={styles.reglageContainer}>
                <Reglage
                  menuItems={reglageMenuItems}
                  iconSize={28}
                  position={{ top: 0, right: 0 }}
                />
              </View>
            )}
            
            {!rightAction && !showReglage && (
              <View style={styles.rightActionPlaceholder} />
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  headComponentContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 20,
    paddingHorizontal: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 20,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  rightAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 20,
  },
  rightActionPlaceholder: {
    width: 40,
    marginLeft: 8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reglageContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default Header;
