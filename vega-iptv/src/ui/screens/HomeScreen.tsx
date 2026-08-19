import React from 'react';
import {FlatList, ScrollView, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {MediaCard} from '../components/MediaCard';
import {AccountInfo, Source} from '../../iptv/types';
import {PlaybackProgress} from '../../storage/schema';
import {formatDate} from '../format';
import {Route} from '../navigation';
import {colors, fontSize, spacing} from '../../theme';

export interface HomeScreenProps {
  source: Source;
  account: AccountInfo | null;
  counts: {live: number; movies: number; series: number; favorites: number};
  resumable: PlaybackProgress[];
  onNavigate: (route: Route) => void;
  onResume: (entry: PlaybackProgress) => void;
}

const tiles = (counts: HomeScreenProps['counts']) => [
  {
    id: 'live',
    label: 'Direct',
    detail: `${counts.live} chaînes`,
    route: {name: 'live'} as Route,
  },
  {
    id: 'movies',
    label: 'Films',
    detail: `${counts.movies} titres`,
    route: {name: 'movies'} as Route,
  },
  {
    id: 'series',
    label: 'Séries',
    detail: `${counts.series} titres`,
    route: {name: 'series'} as Route,
  },
  {
    id: 'favorites',
    label: 'Favoris',
    detail: `${counts.favorites} éléments`,
    route: {name: 'favorites'} as Route,
  },
  {
    id: 'search',
    label: 'Recherche',
    detail: 'Tout le catalogue',
    route: {name: 'search'} as Route,
  },
  {
    id: 'settings',
    label: 'Réglages',
    detail: 'Sources et affichage',
    route: {name: 'settings'} as Route,
  },
];

export const HomeScreen = ({
  source,
  account,
  counts,
  resumable,
  onNavigate,
  onResume,
}: HomeScreenProps) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Vega IPTV</Text>
        <Text style={styles.subtitle}>{source.label}</Text>
      </View>
      {account !== null && (
        <View style={styles.account} testID="home-account">
          <Text style={styles.accountLine}>{account.username}</Text>
          <Text style={styles.accountDetail}>
            Expire le {formatDate(account.expiresAt)}
            {account.maxConnections === undefined
              ? ''
              : ` · ${account.activeConnections ?? 0}/${
                  account.maxConnections
                } connexions`}
          </Text>
        </View>
      )}
    </View>

    {resumable.length > 0 && (
      <>
        <Text style={styles.sectionTitle}>Reprendre</Text>
        <TVFocusGuideView>
          <FlatList
            horizontal={true}
            data={resumable}
            keyExtractor={(entry) => entry.key}
            showsHorizontalScrollIndicator={false}
            initialNumToRender={6}
            windowSize={3}
            maxToRenderPerBatch={6}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            renderItem={({item}) => (
              <MediaCard
                testID={`resume-${item.key}`}
                title={item.title}
                subtitle={item.subtitle}
                image={item.poster}
                layout="grid"
                progress={
                  item.durationSeconds > 0
                    ? item.positionSeconds / item.durationSeconds
                    : undefined
                }
                onPress={() => onResume(item)}
                style={styles.resumeCard}
              />
            )}
          />
        </TVFocusGuideView>
      </>
    )}

    <Text style={styles.sectionTitle}>Parcourir</Text>
    <TVFocusGuideView style={styles.tiles}>
      {tiles(counts).map((tile, index) => (
        <MediaCard
          key={tile.id}
          testID={`tile-${tile.id}`}
          title={tile.label}
          subtitle={tile.detail}
          layout="list"
          hasTVPreferredFocus={index === 0 && resumable.length === 0}
          onPress={() => onNavigate(tile.route)}
          style={styles.tile}
        />
      ))}
    </TVFocusGuideView>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.hero,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.body,
  },
  account: {
    alignItems: 'flex-end',
  },
  accountLine: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  accountDetail: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  resumeCard: {
    marginRight: spacing.sm,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    width: 380,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
});
