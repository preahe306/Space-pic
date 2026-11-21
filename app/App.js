import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic?per_page=1';
const STORAGE_KEY = 'saved-photos';

function cleanText(html) {
  return html.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]*>/g, '');
}

function TodayScreen({ photo, error, saved, onSave }) {
  if (error) {
    return <Text style={styles.message}>{error}</Text>;
  }
  if (!photo) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  const isSaved = saved.some((item) => item.date === photo.date);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.date}>{photo.date}</Text>
      <Text style={styles.title}>{photo.title}</Text>
      {photo.media_type === 'image' && (
        <Image source={{ uri: photo.hdurl }} style={styles.image} />
      )}
      <Button
        title={isSaved ? 'Saved ✓' : 'Save to my collection'}
        onPress={onSave}
        disabled={isSaved}
      />
      <Text style={styles.text}>{cleanText(photo.explanation)}</Text>
    </ScrollView>
  );
}

function CollectionScreen({ saved, onRemove, onOpen }) {
  if (saved.length === 0) {
    return (
      <Text style={styles.message}>
        Nothing saved yet. Save a picture from the Today tab.
      </Text>
    );
  }

  return (
    <FlatList
      data={saved}
      keyExtractor={(item) => item.date}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Pressable style={styles.cardPress} onPress={() => onOpen(item)}>
            <Image source={{ uri: item.hdurl }} style={styles.thumb} />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.hint}>Tap to read more</Text>
            </View>
          </Pressable>
          <Button title="Remove" color="red" onPress={() => onRemove(item.date)} />
        </View>
      )}
    />
  );
}

function DetailScreen({ item, onBack }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button title="‹ Back to collection" onPress={onBack} />
      <Text style={[styles.date, { marginTop: 16 }]}>{item.date}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Image source={{ uri: item.hdurl }} style={styles.image} />
      <Text style={styles.text}>
        {item.explanation ||
          'No description was saved with this one. Remove it and save it again from the Today tab to keep the description.'}
      </Text>
    </ScrollView>
  );
}

export default function App() {
  const [screen, setScreen] = useState('today');
  const [selected, setSelected] = useState(null);
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

  const updateSaved = async (updated) => {
    setSaved(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const savePhoto = () => {
    updateSaved([
      ...saved,
      {
        date: photo.date,
        title: photo.title,
        hdurl: photo.hdurl,
        explanation: cleanText(photo.explanation),
      },
    ]);
  };

  const removePhoto = (date) => {
    updateSaved(saved.filter((item) => item.date !== date));
  };

  if (selected) {
    return (
      <View style={[styles.root, { paddingTop: 50 }]}>
        <DetailScreen item={selected} onBack={() => setSelected(null)} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.tabs}>
        <Button
          title="Today"
          onPress={() => setScreen('today')}
          disabled={screen === 'today'}
        />
        <Button
          title={`Collection (${saved.length})`}
          onPress={() => setScreen('collection')}
          disabled={screen === 'collection'}
        />
      </View>
      {screen === 'today' ? (
        <TodayScreen photo={photo} error={error} saved={saved} onSave={savePhoto} />
      ) : (
        <CollectionScreen saved={saved} onRemove={removePhoto} onOpen={setSelected} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 60,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  container: { padding: 20 },
  message: { padding: 20, fontSize: 16 },
  date: { fontSize: 14, color: '#666', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  image: { width: '100%', height: 300, resizeMode: 'contain', marginBottom: 16 },
  text: { fontSize: 16, lineHeight: 24, marginTop: 16 },
  card: { marginBottom: 20 },
  cardPress: { flexDirection: 'row' },
  thumb: { width: 110, height: 110, borderRadius: 8, backgroundColor: '#eee' },
  cardText: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  hint: { fontSize: 13, color: '#0a6cff', marginTop: 4 },
});