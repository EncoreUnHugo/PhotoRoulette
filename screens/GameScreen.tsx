import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Button, 
  Image, 
  FlatList, 
  SafeAreaView, 
  ActivityIndicator, 
  Pressable,
  Alert 
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as MediaLibrary from 'expo-media-library';
import { RootStackParamList } from '../App';

type GameScreenProps = NativeStackScreenProps<RootStackParamList, 'Game'>;

interface PhotoAsset {
  id: string;
  uri: string;
  localUri?: string;
}

export default function GameScreen({ route, navigation }: GameScreenProps): React.JSX.Element {
  const { sessionId } = route.params;
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [changementRestants, setChangementRestants] = useState(10);

  useEffect(() => {
    const loadPhotos = async (): Promise<void> => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'Impossible d\'accéder à la galerie');
          return;
        }

        const allAssets = await MediaLibrary.getAssetsAsync({
          mediaType: 'photo',
          first: 5000,
          sortBy: 'creationTime',
        });

        const shuffled = allAssets.assets.sort(() => 0.5 - Math.random());
        const selectedAssets = shuffled.slice(0, 16);

        const assetInfos = await Promise.all(
          selectedAssets.map((asset) => MediaLibrary.getAssetInfoAsync(asset))
        );

        const validAssets: PhotoAsset[] = assetInfos
          .filter((info) => info.localUri || info.uri)
          .map((info) => ({
            id: info.id,
            uri: info.uri,
            localUri: info.localUri,
          }));

        setPhotos(validAssets);
        setLoading(false);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de charger les photos');
        setLoading(false);
      }
    };

    loadPhotos();
  }, []);

  const remplacerImage = async (index: number): Promise<void> => {
    if (changementRestants <= 0) {
      Alert.alert('Limite atteinte', 'Plus de changements possibles !');
      return;
    }

    try {
      const allAssets = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 5000,
        sortBy: 'creationTime',
      });

      const shuffled = allAssets.assets.sort(() => 0.5 - Math.random());
      const randomAsset = shuffled[0];
      const info = await MediaLibrary.getAssetInfoAsync(randomAsset);

      if (info.localUri || info.uri) {
        const newPhotos = [...photos];
        newPhotos[index] = {
          id: info.id,
          uri: info.uri,
          localUri: info.localUri,
        };
        setPhotos(newPhotos);
        setChangementRestants(prev => prev - 1);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de remplacer l\'image');
    }
  };

  const goBack = (): void => {
    navigation.goBack();
  };

  const renderItem = ({ item, index }: { item: PhotoAsset; index: number }) => (
    <Pressable onPress={() => remplacerImage(index)}>
      <Image
        source={{ uri: item.localUri || item.uri }}
        style={styles.image}
      />
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.title}>PhotoRoulette</Text>
        <Text style={styles.sessionInfo}>Session : {sessionId}</Text>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des photos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PhotoRoulette</Text>
        <Text style={styles.sessionInfo}>Session : {sessionId}</Text>
        <Text style={styles.subtitle}>
          Changements restants : {changementRestants}
        </Text>
        <Text style={styles.instruction}>
          Tapez sur une photo pour la remplacer !
        </Text>
      </View>

      <FlatList
        data={photos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={4}
        contentContainerStyle={styles.grid}
        style={styles.photoGrid}
      />

      <View style={styles.footer}>
        <Button title="Retour à l'accueil" onPress={goBack} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  sessionInfo: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 10,
    color: '#007AFF',
    fontWeight: '600',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  photoGrid: {
    flex: 1,
  },
  grid: {
    padding: 10,
    justifyContent: 'center',
  },
  image: {
    width: 80,
    height: 80,
    margin: 5,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
