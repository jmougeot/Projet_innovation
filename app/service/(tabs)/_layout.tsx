import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: 'white',
      }}>
      <Tabs.Screen
        name="index"
        options={{
            headerShown: false,
            title: 'Caisse',
            tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="point-of-sale" size={size} color={color} />
          ),
        }}
/>
      
      <Tabs.Screen
        name="mission"
        options={{
            headerShown: false,
            title: 'Misison',
            tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="plan_de_salle"
        options={{
            headerShown: false,
            title: 'Plan',
            tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="analytics" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}