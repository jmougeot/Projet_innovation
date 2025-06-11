import React from 'react';
import { Stack } from 'expo-router';

export default function RestaurantLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
