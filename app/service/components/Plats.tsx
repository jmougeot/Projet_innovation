import React, { useEffect, useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plat } from '@/app/firebase/firebaseMenu';
import { getMissionPlatsForUser } from '@/app/firebase/firebaseMissionOptimized';
import { getAuth } from 'firebase/auth';
import Reglage from '@/app/components/reglage';
import { router } from 'expo-router';
import { useRestaurantSelection } from '@/app/restaurant/RestaurantSelectionContext';

export interface PlatProps {
  plat: Plat;
  onPress: (plat: Plat) => void;
}

export const PlatItem = ({ plat, onPress }: PlatProps) => {
  const [isMission, setIsMission] = useState(false);
  const { selectedRestaurant } = useRestaurantSelection();

  useEffect(() => {
    const fetchMissionPlats = async () => {
      const user = getAuth().currentUser;
      if (user && plat.id && selectedRestaurant?.id) {
        const missionPlatIds = await getMissionPlatsForUser(user.uid, selectedRestaurant.id);
        setIsMission(missionPlatIds.includes(plat.id));
      }
    };
    fetchMissionPlats();
  }, [plat.id, selectedRestaurant?.id]);

  return (
    <Pressable
      key={plat.id}
      style={{ width: '49%' }}
      onPress={() => onPress(plat)}
    >
      {isMission ? (
        <LinearGradient
          colors={['#F8EDCF', '#EFBC51']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.platMission}
        >
          <Text style={[styles.nomPlat, { color: '#8B4513' }]}>{plat.name} {plat.price} € </Text>
        </LinearGradient>
      ) : (
        <View style={styles.platItem}>
          <Text style={styles.nomPlat}>{plat.name} {plat.price} €</Text>
        </View>
      )}
    </Pressable>
  );
};

export const PlatsContainer = ({ children }: { children: React.ReactNode }) => {
  const customMenuItems = [
    {
      label: 'Accueil',
      onPress: () => router.replace('/')
    },
    {
      label: 'Connexion',
      onPress: () => router.replace('/connexion/connexion')
    }
  ];

  return (
    <View style={{ flex: 1 }}>
      <Reglage 
        menuItems={customMenuItems} 
        position={{ top: 15, right: 15 }} 
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  platItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    backgroundColor: '#CAE1EF',
    borderRadius: 30,
    height: 40,
  },
  platMission: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderRadius: 30,
    height: 40,
    width: '100%',
  },
  nomPlat: {
    fontSize: 16,
    fontWeight: '500',
    color: '#194A8D',
  },
  missionTag: {
    color: '#8B4513',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default {
  PlatItem,
  PlatsContainer
};