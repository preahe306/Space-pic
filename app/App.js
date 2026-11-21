import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Image, ScrollView, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic?per_page=1';
const STORAGE_KEY = 'saved-photos';

export default function App() {
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => setPhoto(data[0]))
      .catch(() => setError('Could not load the picture.'));

    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) setSaved(JSON.parse(value));
    });
  }, []);

  const isSaved = photo && saved.some((item) => item.date === photo.date);

  const savePhoto = async () => {
    const updated = [
      ...saved,
      { date: photo.date, title: photo.title, hdurl: photo.hdurl },
    ];
    setSaved(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (!photo) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  const explanation = photo.explanation
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]*>/g, '');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.date}>{photo.date}</Text>
      <Text style={styles.title}>{photo.title}</Text>
      {photo.media_type === 'image' && (
        <Image source={{ uri: photo.hdurl }} style={styles.image} />
      )}
      <Button
        title={isSaved ? 'Saved ✓' : 'Save to my collection'}
        onPress={savePhoto}
        disabled={isSaved}
      />
      <Text style={styles.count}>{saved.length} saved</Text>
      <Text style={styles.text}>{explanation}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60 },
  date: { fontSize: 14, color: '#666', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  image: { width: '100%', height: 300, resizeMode: 'contain', marginBottom: 16 },
  count: { textAlign: 'center', color: '#666', marginVertical: 8 },
  text: { fontSize: 16, lineHeight: 24 },
  error: { padding: 20, paddingTop: 80, fontSize: 16 },
});