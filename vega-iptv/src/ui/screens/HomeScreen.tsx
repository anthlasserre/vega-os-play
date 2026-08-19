import React from 'react';
import {FlatList, ScrollView, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {IconName} from '../components/Icon';
import {MediaCard} from '../components/MediaCard';
import {GRID_GAP_SIZE, useLayout} from '../layout';
import {AccountInfo, Source} from '../../iptv/types';
import {HistoryEntry, PlaybackProgress} from '../../storage/schema';
import {formatDate, formatRelativeDay} from '../format';
import {Route} from '../navigation';
import {colors, fontSize, radius, spacing} from '../../theme';

export interface HomeScreenProps {
  source: Source;
  account: AccountInfo | null;
  counts: {
    live: number;
    movies: number;
    series: number;
    favorites: number;
    history: number;
  };
  resumable: PlaybackProgress[];
  recent: HistoryEntry[];
  onNavigate: (route: Route) => void;
  onResume: (entry: PlaybackProgress) => void;
  onReplay: (entry: HistoryEntry) => void;
}

/** Combien d'entrées d'historique tiennent dans un rail sans le rendre infini. */
const RECENT_LIMIT = 12;

const compact = (value: number): string =>
  value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} k` : `${value}`;

const tiles = (
  counts: HomeScreenProps['counts'],
): {id: string; label: string; detail: string; icon: IconName; route: Route}[] => [
  {id: 'live', label: 'Direct', detail: `${compact(counts.live)} chaînes`, icon: 'live', route: {name: 'live'}},
  {id: 'movies', label: 'Films', detail: `${compact(counts.movies)} titres`, icon: 'movie', route: {name: 'movies'}},
  {id: 'series', label: 'Séries', detail: `${compact(counts.series)} titres`, icon: 'series', route: {name: 'series'}},
  {id: 'favorites', label: 'Favoris', detail: `${counts.favorites}`, icon: 'favorite', route: {name: 'favorites'}},
  {id: 'history', label: 'Historique', detail: `${counts.history}`, icon: 'history', route: {name: 'history'}},
  {id: 'search', label: 'Recherche', detail: 'Tout', icon: 'search', route: {name: 'search'}},
  {id: 'settings', label: 'Réglages', detail: 'Sources, tampon', icon: 'settings', route: {name: 'settings'}},
];

export const HomeScreen = ({
  source,
  account,
  counts,
  resumable,
  recent,
  onNavigate,
  onResume,
  onReplay,
}: HomeScreenProps) => {
  const metrics = useLayout();

  // Les rails d'affiches n'ont ni colonne de catégories ni panneau latéral :
  // on peut y viser une carte un peu plus large que dans une grille.
  const railWidth = Math.round(metrics.posterWidth * 1.1);
  const railHeight = Math.round(railWidth * 1.5);

  // Sept tuiles sur une seule rangée seraient minuscules ; quatre par rangée
  // laissent une cible confortable à la télécommande.
  const tileWidth = Math.floor(
    (metrics.width - 2 * metrics.gutter - 3 * spacing.xs) / 4,
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingHorizontal: metrics.gutter,
        paddingVertical: metrics.vGutter,
      }}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
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
                : ` · ${account.activeConnections ?? 0}/${account.maxConnections} connexions`}
            </Text>
          </View>
        )}
      </View>

      <TVFocusGuideView style={[styles.tiles, {gap: spacing.xs}]}>
        {tiles(counts).map((tile, index) => (
          <MediaCard
            key={tile.id}
            testID={`tile-${tile.id}`}
            title={tile.label}
            subtitle={tile.detail}
            icon={tile.icon}
            layout="list"
            rowHeight={metrics.rowHeight}
            hasTVPreferredFocus={index === 0 && resumable.length === 0}
            onPress={() => onNavigate(tile.route)}
            style={{width: tileWidth}}
          />
        ))}
      </TVFocusGuideView>

      {resumable.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Reprendre</Text>
          <TVFocusGuideView>
            <FlatList
              horizontal={true}
              data={resumable}
              keyExtractor={entry => entry.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
              initialNumToRender={6}
              windowSize={3}
              maxToRenderPerBatch={6}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={true}
              renderItem={({item, index}) => (
                <MediaCard
                  testID={`resume-${item.key}`}
                  title={item.title}
                  subtitle={item.subtitle}
                  image={item.poster}
                  layout="grid"
                  posterWidth={railWidth}
                  posterHeight={railHeight}
                  shape={item.kind === 'live' ? 'wide' : 'poster'}
                  hasTVPreferredFocus={index === 0}
                  progress={
                    item.durationSeconds > 0
                      ? item.positionSeconds / item.durationSeconds
                      : undefined
                  }
                  onPress={() => onResume(item)}
                />
              )}
            />
          </TVFocusGuideView>
        </>
      )}

      {recent.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Récemment vu</Text>
            <Text
              style={styles.sectionLink}
              onPress={() => onNavigate({name: 'history'})}>
              tout l'historique
            </Text>
          </View>
          <TVFocusGuideView>
            <FlatList
              horizontal={true}
              data={recent.slice(0, RECENT_LIMIT)}
              keyExtractor={entry => entry.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
              initialNumToRender={6}
              windowSize={3}
              maxToRenderPerBatch={6}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={true}
              renderItem={({item}) => (
                <MediaCard
                  testID={`recent-${item.key}`}
                  title={item.title}
                  subtitle={formatRelativeDay(item.watchedAt)}
                  image={item.poster}
                  layout="grid"
                  posterWidth={railWidth}
                  posterHeight={railHeight}
                  shape={item.live ? 'wide' : 'poster'}
                  onPress={() => onReplay(item)}
                />
              )}
            />
          </TVFocusGuideView>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexShrink: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.hero,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  account: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  accountLine: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: '600',
  },
  accountDetail: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionLink: {
    color: colors.accent,
    fontSize: fontSize.micro,
  },
  rail: {
    gap: GRID_GAP_SIZE,
  },
});
