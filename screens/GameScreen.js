import React from 'react';
import { View, Text } from 'react-native';

export default function GameScreen({ route }) {
  const { sessionId } = route.params;

  return (
    <View>
      <Text>Bienvenue dans la session !</Text>
      <Text>ID de session : {sessionId}</Text>
      {/* Tu peux maintenant charger des photos, partager des actions, etc. */}
    </View>
  );
}
