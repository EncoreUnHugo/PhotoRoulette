import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
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
import { gameScreenStyles as styles } from './GameScreen.styles';

type GameScreenProps = NativeStackScreenProps<RootStackParamList, 'Game'>;

interface PhotoAsset {
  id: string;
  uri: string;
  localUri?: string;
  replacementCount: number;
}

export default function GameScreen({ route, navigation }: GameScreenProps) {
  const { sessionId } = route.params;
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalReplacements, setGlobalReplacements] = useState(0);
  const [isSelectionValidated, setIsSelectionValidated] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);

  const MAX_PHOTOS = 10;
  const MAX_REPLACEMENTS_PER_IMAGE = 3;
  const MAX_GLOBAL_REPLACEMENTS = 30;

  useEffect(() => {
    const generateRandomSelection = async (): Promise<void> => {
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

        setAvailableAssets(allAssets.assets);

        const shuffled = allAssets.assets.sort(() => 0.5 - Math.random());
        const selectedAssets = shuffled.slice(0, MAX_PHOTOS);

        const assetInfos = await Promise.all(
          selectedAssets.map((asset) => MediaLibrary.getAssetInfoAsync(asset))
        );

        const validAssets: PhotoAsset[] = assetInfos
          .filter((info) => info.localUri || info.uri)
          .map((info) => ({
            id: info.id,
            uri: info.uri,
            localUri: info.localUri,
            replacementCount: 0,
          }));

        setPhotos(validAssets);
        setLoading(false);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de charger les photos');
        setLoading(false);
      }
    };

    generateRandomSelection();
  }, []);

  const validateSelection = (): void => {
    setIsSelectionValidated(true);
    Alert.alert('Sélection validée', 'Vous pouvez maintenant modifier vos photos !');
  };

  const generateNewSelection = async (): Promise<void> => {
    try {
      const shuffled = availableAssets.sort(() => 0.5 - Math.random());
      const selectedAssets = shuffled.slice(0, MAX_PHOTOS);

      const assetInfos = await Promise.all(
        selectedAssets.map((asset) => MediaLibrary.getAssetInfoAsync(asset))
      );

      const validAssets: PhotoAsset[] = assetInfos
        .filter((info) => info.localUri || info.uri)
        .map((info) => ({
          id: info.id,
          uri: info.uri,
          localUri: info.localUri,
          replacementCount: 0,
        }));

      setPhotos(validAssets);
      setGlobalReplacements(0); 
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer une nouvelle sélection');
    }
  };

  const replaceImage = async (index: number): Promise<void> => {
    if (!isSelectionValidated) {
      Alert.alert('Sélection non validée', 'Vous devez d\'abord valider votre sélection !');
      return;
    }

    if (index >= photos.length) return;
    
    const currentPhoto = photos[index];
    
    if (currentPhoto.replacementCount >= MAX_REPLACEMENTS_PER_IMAGE) {
      Alert.alert(
        'Limite atteinte', 
        `Cette image a déjà été remplacée ${MAX_REPLACEMENTS_PER_IMAGE} fois !`
      );
      return;
    }

    if (globalReplacements >= MAX_GLOBAL_REPLACEMENTS) {
      Alert.alert('Limite globale atteinte', 'Plus de remplacements possibles !');
      return;
    }

    try {
      const usedPhotoIds = photos.map(photo => photo.id);
      const availableForReplacement = availableAssets.filter(asset => !usedPhotoIds.includes(asset.id));
      
      if (availableForReplacement.length === 0) {
        Alert.alert('Aucune photo', 'Plus de photos disponibles dans votre galerie');
        return;
      }

      const shuffled = availableForReplacement.sort(() => 0.5 - Math.random());
      const randomAsset = shuffled[0];
      const info = await MediaLibrary.getAssetInfoAsync(randomAsset);

      if (info.localUri || info.uri) {
        const newPhotos = [...photos];
        newPhotos[index] = {
          id: info.id,
          uri: info.uri,
          localUri: info.localUri,
          replacementCount: currentPhoto.replacementCount + 1,
        };
        setPhotos(newPhotos);
        setGlobalReplacements(prev => prev + 1);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de remplacer l\'image');
    }
  };

  

  const renderItem = ({ item, index }: { item: PhotoAsset; index: number }) => {
    const canReplace = item.replacementCount < MAX_REPLACEMENTS_PER_IMAGE && isSelectionValidated;
    
    return (
      <Pressable 
        onPress={() => replaceImage(index)}
        style={[styles.imageContainer, !canReplace && styles.imageDisabled]}
      >
        <Image
          source={{ uri: item.localUri || item.uri }}
          style={styles.image}
        />
        {isSelectionValidated && (
          <View style={styles.replacementBadge}>
            <Text style={styles.replacementText}>
              {item.replacementCount}/{MAX_REPLACEMENTS_PER_IMAGE}
            </Text>
          </View>
        )}
        {!isSelectionValidated && (
          <View style={styles.selectionOverlay}>
            <Text style={styles.selectionText}>Sélection aléatoire</Text>
          </View>
        )}
      </Pressable>
    );
  };

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
        
        {!isSelectionValidated ? (
          <>
            <Text style={styles.subtitle}>
              Sélection aléatoire générée : {photos.length} photos
            </Text>
            <Text style={styles.instruction}>
              Voici une sélection aléatoire de vos photos. Validez-la ou générez-en une nouvelle !
            </Text>
            <View style={styles.selectionButtons}>
              <Pressable style={styles.validateButton} onPress={validateSelection}>
                <Text style={styles.validateButtonText}>✓ Valider cette sélection</Text>
              </Pressable>
              <Pressable style={styles.regenerateButton} onPress={generateNewSelection}>
                <Text style={styles.regenerateButtonText}>🔄 Nouvelle sélection</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Photos sélectionnées : {photos.length}/{MAX_PHOTOS}
            </Text>
            <Text style={styles.replacementInfo}>
              Remplacements globaux : {globalReplacements}/{MAX_GLOBAL_REPLACEMENTS}
            </Text>
            <Text style={styles.instruction}>
              Tapez sur une photo pour la remplacer (max {MAX_REPLACEMENTS_PER_IMAGE} par image) !
            </Text>
          </>
        )}
      </View>

      <FlatList
        data={photos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        style={styles.photoGrid}
      />

      <View style={styles.footer}>
        <Button title="Retour à l'accueil" onPress={navigation.goBack} />
      </View>
    </SafeAreaView>
  );
}
