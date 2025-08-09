import { useState } from 'react';
import { View, Text, Button, TextInput, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: HomeScreenProps): React.JSX.Element {
  const [sessionCode, setSessionCode] = useState('');

  const createSession = async (): Promise<void> => {
    // Simulation de création de session sans Supabase
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sessionId = Math.floor(Math.random() * 10000); 
    
    Alert.alert('Session créée', `Code de session: ${code}`);
    navigation.navigate('Game', { sessionId });
  };

  const joinSession = async (): Promise<void> => {
    if (!sessionCode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un code de session');
      return;
    }

    if (sessionCode.length >= 4) {
      const sessionId = Math.floor(Math.random() * 10000); 
      navigation.navigate('Game', { sessionId });
    } else {
      Alert.alert('Erreur', 'Session introuvable');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PhotoRoulette</Text>
      <Button title="Créer une session" onPress={createSession} />
      <Text style={styles.subtitle}>Ou rejoindre une session :</Text>
      <TextInput
        style={styles.input}
        placeholder="Code de session"
        value={sessionCode}
        onChangeText={setSessionCode}
      />
      <Button title="Rejoindre" onPress={joinSession} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
});
