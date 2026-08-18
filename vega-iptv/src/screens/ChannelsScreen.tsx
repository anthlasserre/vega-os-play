import React, {useMemo, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {FocusableCard} from '../components/FocusableCard';
import {ALL_CATEGORY_ID, Channel, Playlist} from '../iptv/types';
import {streamKindOf} from '../player/streamKind';
import {colors, fontSize, spacing} from '../theme';

export interface ChannelsScreenProps {
  playlist: Playlist;
  onSelectChannel: (channel: Channel) => void;
  onBack: () => void;
}

const GRID_COLUMNS = 3;

export const ChannelsScreen = ({
  playlist,
  onSelectChannel,
  onBack,
}: ChannelsScreenProps) => {
  const [categoryId, setCategoryId] = useState<string>(ALL_CATEGORY_ID);

  const channels = useMemo(
    () =>
      categoryId === ALL_CATEGORY_ID
        ? playlist.channels
        : playlist.channels.filter(channel => channel.group === categoryId),
    [playlist.channels, categoryId],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chaînes</Text>
        <Text style={styles.counter}>
          {channels.length} / {playlist.channels.length}
        </Text>
      </View>

      <View style={styles.body}>
        <TVFocusGuideView style={styles.sidebar}>
          <FlatList
            data={playlist.categories}
            keyExtractor={category => category.id}
            initialNumToRender={10}
            windowSize={5}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            renderItem={({item, index}) => (
              <FocusableCard
                testID={`category-${item.id}`}
                title={item.name}
                subtitle={`${item.channelCount} chaînes`}
                hasTVPreferredFocus={index === 0}
                style={[
                  styles.categoryCard,
                  item.id === categoryId && styles.categorySelected,
                ]}
                onPress={() => setCategoryId(item.id)}
              />
            )}
          />
        </TVFocusGuideView>

        <TVFocusGuideView style={styles.grid}>
          <FlatList
            key={`grid-${GRID_COLUMNS}`}
            data={channels}
            numColumns={GRID_COLUMNS}
            keyExtractor={channel => channel.id}
            columnWrapperStyle={styles.gridRow}
            initialNumToRender={12}
            windowSize={5}
            maxToRenderPerBatch={9}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            renderItem={({item}) => (
              <FocusableCard
                testID={`channel-${item.id}`}
                title={item.name}
                subtitle={
                  streamKindOf(item.url) === 'url' ? 'MP4 · mode URL' : 'Adaptatif · MSE'
                }
                style={styles.channelCard}
                onPress={() => onSelectChannel(item)}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>Aucune chaîne dans cette catégorie.</Text>
            }
          />
        </TVFocusGuideView>
      </View>

      <FocusableCard
        testID="channels-back"
        title="Changer de source"
        style={styles.backButton}
        onPress={onBack}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  counter: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 300,
    marginRight: spacing.md,
  },
  categoryCard: {
    marginBottom: spacing.sm,
    minHeight: 84,
  },
  categorySelected: {
    borderColor: colors.accent,
  },
  grid: {
    flex: 1,
  },
  gridRow: {
    justifyContent: 'flex-start',
  },
  channelCard: {
    flex: 1 / GRID_COLUMNS,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: 110,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    padding: spacing.md,
  },
  backButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
  },
});
