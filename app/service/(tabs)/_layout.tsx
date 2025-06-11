import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function ServiceTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#194A8D',
        tabBarInactiveTintColor: '#83A8C6',
        tabBarStyle: {
          backgroundColor: '#F3EFEF',
          borderTopWidth: 1,
          borderTopColor: '#CAE1EF',
          height: 60,
          paddingTop: 5,
          paddingBottom: 5,
        },
        headerStyle: {
          backgroundColor: '#194A8D',
        },
        headerTintColor: 'white',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      
      <Tabs.Screen
        name="kitchen"
        options={{
          headerShown: false,
          title: 'Cuisine Service',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="restaurant-menu" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="plan_de_salle"
        options={{
          headerShown: false,
          title: 'Plan de Salle',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="table-restaurant" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="AffichageMission"
        options={{
          headerShown: false,
          title: 'Missions',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="assignment" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}