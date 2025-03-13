import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import CreateMissionPage from './CreateMissionPage';
import UserMissionsPage from './UserMissionsPage';
import AllMissionsPage from './AllMissionsPage';
import { Ionicons } from '@expo/vector-icons';
import Head from '@/app/components/Head';

// Définir le type des paramètres de navigation
export type MissionStackParamList = {
  MissionHome: undefined;
  CreateMission: undefined;
  UserMissions: undefined;
  AllMissions: undefined;
};

// Définir le type de pile de navigation
const Stack = createStackNavigator<MissionStackParamList>();

// Page d'accueil des missions
const MissionHome = () => {
  const navigation = useNavigation<NavigationProp<MissionStackParamList>>();
  
  return (
    <SafeAreaView style={styles.container}>
      <Head title="Missions" />      
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('UserMissions')}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="list" size={24} color="#1890ff" />
          <Text style={styles.cardTitle}>Mes missions</Text>
        </View>
        <Text style={styles.cardDescription}>
          Consultez et gérez vos missions actives
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('AllMissions')}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="search" size={24} color="#1890ff" />
          <Text style={styles.cardTitle}>Toutes les missions</Text>
        </View>
        <Text style={styles.cardDescription}>
          Découvrez et rejoignez de nouvelles missions
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('CreateMission')}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="add-circle" size={24} color="#1890ff" />
          <Text style={styles.cardTitle}>Créer une mission</Text>
        </View>
        <Text style={styles.cardDescription}>
          Créez une nouvelle mission pour vous ou votre équipe
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// Navigateur principal des missions
const MissionNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="MissionHome"
      screenOptions={{
        headerShown: false,
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="MissionHome" 
        component={MissionHome} 
        options={{ title: 'Missions' }}
      />
      <Stack.Screen 
        name="CreateMission" 
        component={CreateMissionPage} 
        options={{ title: 'Créer une mission' }}
      />
      <Stack.Screen 
        name="UserMissions" 
        component={UserMissionsPage} 
        options={{ title: 'Mes missions' }}
      />
      <Stack.Screen 
        name="AllMissions" 
        component={AllMissionsPage} 
        options={{ title: 'Toutes les missions' }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default MissionNavigator;
