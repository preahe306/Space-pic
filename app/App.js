import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text } from 'react-native';

const API_URL = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic?per_page=1';

export default function App() {
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => setPhoto(data[0]))
      .catch(() => setError('Could not load the picture.'));
  }, []);

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (!photo) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  const explanation = photo.explanation.replace(/<[^>]*>/g, '');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.date}>{photo.date}</Text>
      <Text style={styles.title}>{photo.title}</Text>
      {photo.media_type === 'image' && (
        <Image source={{ uri: photo.hdurl }} style={styles.image} />
      )}
      <Text style={styles.text}>{explanation}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60 },
  date: { fontSize: 14, color: '#666', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  image: { width: '100%', height: 300, resizeMode: 'contain', marginBottom: 16 },
  text: { fontSize: 16, lineHeight: 24 },
  error: { padding: 20, paddingTop: 80, fontSize: 16 },
});
