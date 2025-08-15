import { useState } from 'react';
import { View, Text, Button, TextInput, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { homeScreenStyles as styles } from './HomeScreen.styles';
import { api } from 'convex/_generated/api';
import { useQueries, useMutation } from 'convex/react';
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: HomeScreenProps): React.JSX.Element {
  const [sessionCode, setSessionCode] = useState('');
  const [username, setUsername] = useState('');


  const createUserMutation = useMutation(api.users.createUser);
  const createRoomMutation = useMutation(api.rooms.createRoom);


  const createUser = async (username : string) => {
    const user = await createUserMutation({username: username});
    if(user) return user;
    throw new Error("Failed to create user, please try to choose another username");
  }

  const createRoom = async (username: string) => {
    const user = await createUser(username);
    const room = await createRoomMutation({
      hostUserId: user._id,
      status: "waiting",
      maxPlayers: 4,
      numberOfRounds: 1,
    });
    console.log(user.username);
    if(room) {
      navigation.navigate('Game', { sessionId: room._id.toString() });
      return room;
    }

    throw new Error("Failed to create room");
  }


  const joinSession = async (): Promise<void> => {
    if (!sessionCode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un code de session');
      return;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PhotoRoulette</Text>
      <Text>Entrez votre username</Text>
      <TextInput 
        style={styles.input} 
        placeholder='username' 
        value={username}
        onChangeText={setUsername}
      />
      <Button title="Créer une session" onPress={() => createRoom(username)} />
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
