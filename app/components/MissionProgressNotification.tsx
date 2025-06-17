import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MissionProgressNotificationProps {
  visible: boolean;
  message: string;
  updatedMissions: number;
  onClose: () => void;
}

const MissionProgressNotification: React.FC<MissionProgressNotificationProps> = ({
  visible,
  message,
  updatedMissions,
  onClose
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Afficher la notification
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000), // Afficher pendant 3 secondes
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        onClose();
      });
    }
  }, [visible, fadeAnim, onClose]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.notification}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Missions mises à jour !</Text>
          <Text style={styles.message}>
            {updatedMissions} mission{updatedMissions > 1 ? 's' : ''} 
            {updatedMissions > 1 ? ' ont été mises' : ' a été mise'} à jour
          </Text>
        </View>
        
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  notification: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 4,
  },
});

export default MissionProgressNotification;
