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
        name="consigne"
        options={{
            headerShown: false,
            title: 'Consigne',
            tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="point-of-sale" size={size} color={color} />
          ),
        }}
/>
      
      <Tabs.Screen
        name="cuisine"
        options={{
            headerShown: false,
            title: 'Cusine',
            tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="stock"
        options={{
            headerShown: false,
            title: 'G.S',
            tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}