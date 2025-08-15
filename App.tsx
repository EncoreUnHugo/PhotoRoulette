import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';

export type RootStackParamList = {
  Home: undefined;
  Game: { sessionId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Initialize the Convex client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function App(): React.JSX.Element {
  return (
    <ConvexProvider client={convex}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ConvexProvider>
  );
}
