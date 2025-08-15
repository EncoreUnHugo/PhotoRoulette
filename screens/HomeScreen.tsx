import { use, useState } from 'react';
import { View, Text, Button, TextInput, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { homeScreenStyles as styles } from './HomeScreen.styles';
import { api } from 'convex/_generated/api';
import {useMutation, useQuery } from 'convex/react';
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: HomeScreenProps): React.JSX.Element {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');

  const createUserMutation = useMutation(api.users.createUser);
  const createRoomMutation = useMutation(api.rooms.createRoom);
  const joinRoomMutation = useMutation(api.rooms.joinRoom);
  const getUserByUsername = useQuery(api.users.getUserByUsername, { username });

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
      navigation.navigate('Game', { roomCode: room.code });
      return room;
    }

    throw new Error("Failed to create room");
  }

  const getCurrentUser = () => {
    const user = getUserByUsername;
    if(user) return user;
    throw new Error("User not found");
  }

  const joinRoom = async (roomCode: string) => {
    const user = getCurrentUser();
    const room = await joinRoomMutation({
      roomCode: roomCode,
      userId: user._id,
    });
    console.log("found: ",room);
    if(room){
      navigation.navigate('Game', { roomCode: room.code });
      return room;
    }
    throw new Error("Failed to join room, please check the code and try again");
  }


  

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
        value={roomCode}
        onChangeText={setRoomCode}
      />
      <Button title="Rejoindre" onPress={() => joinRoom(roomCode)} />
    </View>
  );
}
