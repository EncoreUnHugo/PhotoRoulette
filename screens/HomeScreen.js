import React, { useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ navigation }) {
  const [sessionCode, setSessionCode] = useState('');

  const createSession = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from('sessions')
      .insert([{ code }])
      .select()
      .single();

    if (!error) {
      navigation.navigate('Game', { sessionId: data.id });
    }
  };

  const joinSession = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', sessionCode)
      .single();

    if (!error && data) {
      navigation.navigate('Game', { sessionId: data.id });
    } else {
      alert('Session introuvable');
    }
  };

  return (
    <View>
      <Button title="Créer une session" onPress={createSession} />
      <Text>Ou rejoindre une session :</Text>
      <TextInput
        placeholder="Code de session"
        value={sessionCode}
        onChangeText={setSessionCode}
      />
      <Button title="Rejoindre" onPress={joinSession} />
    </View>
  );
}
