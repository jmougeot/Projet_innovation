import React from 'react';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="avatar" 
        options={{ 
          headerShown: true,
          title: "Profil Utilisateur",
          headerStyle: {
            backgroundColor: '#CAE1EF',
          },
          headerTintColor: '#083F8C',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
    </Stack>
  );
}