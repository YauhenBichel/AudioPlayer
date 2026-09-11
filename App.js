import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import TrackPlayer, { State } from 'react-native-track-player';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useActiveTrack, usePlaybackState } from 'react-native-track-player';
import { deleteAllRecordFiles, deleteRecordFile, pickAudioFiles, resetPlaylistDir } from './src/services/files';
import { applyRepeatMode, setupPlayer, skipWrapped } from './src/services/player';
import { Header } from './src/components/Header';
import { ImageButton } from './src/components/ImageButton';
import { IconButton } from './src/components/IconButton';
import { RecordListItem } from './src/components/RecordListItem';
import AdvertisementBanner from './src/components/AdvertisementBanner';
import { playSrc, stopSrc, repeatSoundOnceSrc, repeatSoundAlwaysSrc, repeatPlaylistSrc, repeatPlaylistActiveSrc } from './src/Constants';
import mobileAds from 'react-native-google-mobile-ads';

export default function App() {
  const [records, setRecords] = useState([]);
  const [repeatAll, setRepeatAll] = useState(false);
  const [ready, setReady] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const isPlaying = playbackState.state === State.Playing;

  const currentIndex = useMemo(() => {
    if (!activeTrack?.id) return -1;
    return records.findIndex((r) => r.id === activeTrack.id);
  }, [activeTrack, records]);

  // Initialize player and files
  useEffect(() => {
    const init = async () => {
      try {
        await resetPlaylistDir();
        await setupPlayer();
        await TrackPlayer.reset();
        mobileAds().initialize().catch(() => {}); // Ignore errors
        setReady(true);
      } catch (error) {
        Alert.alert('Could not start the player', String(error));
      }
    };
    init();
  }, []);

  // Apply repeat modes when state changes
  useEffect(() => {
    if (!ready) return;
    applyRepeatMode({ currentRepeats: !!records[currentIndex]?.repeat, repeatAll }).catch((e) =>
      console.warn('repeat mode error:', e),
    );
  }, [repeatAll, currentIndex, records, ready]);

  // Add files
  const handleAdd = async () => {
    if (!ready || isAdding) return;
    setIsAdding(true);
    try {
      const { records: added, failed } = await pickAudioFiles();
      if (failed > 0) {
        Alert.alert('Some files could not be added');
      }
      if (added.length > 0) {
        const tracksToAdd = added.map((r) => ({
          id: r.id,
          url: r.url,
          title: r.title,
          artist: 'ClosePlayer',
        }));
        await TrackPlayer.add(tracksToAdd);
        setRecords((prev) => [...prev, ...added.map((r) => ({ ...r, repeat: false }))]);
      }
    } catch (error) {
      console.warn('Add files error:', error);
    } finally {
      setIsAdding(false);
    }
  };

  // Play control
  const handlePlay = async () => {
    try {
      if (records.length === 0) {
        Alert.alert('No records');
        return;
      }
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        if (currentIndex === -1) {
          await TrackPlayer.skip(0);
        }
        await TrackPlayer.play();
      }
    } catch (error) {
      console.warn('handlePlay error:', error);
    }
  };

  // Navigation
  const handlePrev = async () => {
    try {
      if (records.length === 0) {
        Alert.alert('No records');
        return;
      }
      await skipWrapped(-1);
    } catch (error) {
      console.warn('handlePrev error:', error);
    }
  };

  const handleNext = async () => {
    try {
      if (records.length === 0) {
        Alert.alert('No records');
        return;
      }
      await skipWrapped(1);
    } catch (error) {
      console.warn('handleNext error:', error);
    }
  };

  // Track selection
  const handleSelect = async (id) => {
    try {
      const index = records.findIndex((r) => r.id === id);
      if (index !== -1) {
        await TrackPlayer.skip(index);
        await TrackPlayer.play();
      }
    } catch (error) {
      console.warn('handleSelect error:', error);
    }
  };

  // Repeat one toggle
  const handleToggleRepeatOne = async (id) => {
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) return;
    const newRepeat = !records[index].repeat;
    const updated = [...records];
    updated[index] = { ...updated[index], repeat: newRepeat };
    setRecords(updated);
  };

  // Delete one
  const handleDeleteOne = async (id) => {
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) return;
    try {
      await TrackPlayer.remove(index);
      await deleteRecordFile(records[index].url);
      setRecords((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.warn('Delete error:', error);
    }
  };

  // Delete all
  const handleDeleteAll = async () => {
    if (records.length === 0) return;
    Alert.alert(
      'Delete all?',
      'This removes every file from the playlist.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: async () => {
            try {
              await TrackPlayer.reset();
              await deleteAllRecordFiles();
              setRecords([]);
            } catch (error) {
              console.warn('Delete all error:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Renderers
  const renderAddButton = () => (
    <ImageButton
      imgSrc={require('./images/add.png')}
      onPress={handleAdd}
      style={styles.addButton}
    />
  );

  const renderRepeatAll = () => (
    <ImageButton
      imgSrc={repeatAll ? repeatPlaylistActiveSrc : repeatPlaylistSrc}
      onPress={() => setRepeatAll((prev) => !prev)}
      style={styles.repeatButton}
    />
  );

  const renderRepeatOne = () => {
    if (currentIndex === -1) return null;
    const currentRecord = records[currentIndex];
    return (
      <ImageButton
        imgSrc={currentRecord?.repeat ? repeatSoundAlwaysSrc : repeatSoundOnceSrc}
        onPress={() => handleToggleRepeatOne(currentRecord.id)}
        style={styles.repeatButton}
      />
    );
  };

  const renderControls = () => (
    <View style={styles.controlsRow}>
      <ImageButton imgSrc={require('./images/prev.png')} onPress={handlePrev} style={styles.controlButton} />
      <ImageButton
        imgSrc={isPlaying ? stopSrc : playSrc}
        onPress={handlePlay}
        style={styles.playButton}
      />
      <ImageButton imgSrc={require('./images/next.png')} onPress={handleNext} style={styles.controlButton} />
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header title="ClosePlayer" />
        <View style={styles.playlistPanel}>
          <View style={styles.playlistHeader}>
            {renderAddButton()}
            <Text style={styles.playlistTitle}>Playlist</Text>
            <View style={styles.playlistHeaderRight}>
              {renderRepeatAll()}
              <IconButton
                iconName="trash"
                iconSize={25}
                color="gray"
                onPress={handleDeleteAll}
                accessibilityLabel="Delete all"
              />
            </View>
          </View>
          {records.length === 0 ? (
            <Text style={styles.noAudio}>No audio</Text>
          ) : (
            <FlatList
              data={records}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <RecordListItem
                  id={item.id}
                  title={item.title}
                  selected={index === currentIndex}
                  onPressItem={handleSelect}
                  onDeleteItem={handleDeleteOne}
                />
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.currentTitle}>
            {currentIndex >= 0 ? records[currentIndex].title : ''}
          </Text>
          {renderRepeatOne()}
        </View>
        {renderControls()}
        <AdvertisementBanner />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  playlistPanel: {
    flex: 6,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    margin: 5,
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  addButton: {
    width: 35,
    height: 35,
    marginRight: 10,
  },
  playlistTitle: {
    flex: 1,
    fontSize: 20,
    textAlign: 'center',
    color: 'gray',
  },
  playlistHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
  },
  repeatButton: {
    width: 35,
    height: 35,
    marginLeft: 5,
  },
  listContent: {
    paddingVertical: 5,
  },
  noAudio: {
    flex: 1,
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  currentTitle: {
    flex: 1,
    fontSize: 18,
    color: 'orange',
    marginRight: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  controlButton: {
    width: 35,
    height: 35,
    marginHorizontal: 15,
  },
  playButton: {
    width: 45,
    height: 45,
  },
});
