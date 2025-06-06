import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

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
}

const Header = ({ 
  title, 
  showBackButton = true, 
  onBackPress,
  rightAction,
  backgroundColor = 'transparent',
  textColor = '#FFFFFF'
}: HeaderProps) => {
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
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
        
        {rightAction ? (
          <Pressable 
            style={styles.rightAction}
            onPress={rightAction.onPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {rightAction.icon}
          </Pressable>
        ) : (
          <View style={styles.rightActionPlaceholder} />
        )}
      </View>
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
  }
});

export default Header;
