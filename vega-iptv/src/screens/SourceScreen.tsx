import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {FocusableCard} from '../components/FocusableCard';
import {devConfig} from '../devConfig';
import {Source} from '../iptv/types';
import {colors, fontSize, spacing} from '../theme';

export interface SourceScreenProps {
  onSelect: (source: Source) => void;
  error: string | null;
}

interface Entry {
  key: string;
  title: string;
  subtitle: string;
  source: Source;
}

const buildEntries = (): Entry[] => {
  const entries: Entry[] = [
    {
      key: 'demo',
      title: 'Playlist de démo',
      subtitle: '6 flux publics — 3 MP4 lisibles sans lecteur MSE',
      source: {kind: 'demo'},
    },
  ];

  if (devConfig.m3uUrl !== '') {
    entries.push({
      key: 'm3u',
      title: 'Playlist M3U',
      subtitle: devConfig.m3uUrl,
      source: {kind: 'm3u', url: devConfig.m3uUrl},
    });
  }

  if (devConfig.xtream.host !== '') {
    entries.push({
      key: 'xtream',
      title: 'Portail Xtream Codes',
      subtitle: `${devConfig.xtream.host} · ${devConfig.xtream.username}`,
      source: {kind: 'xtream', ...devConfig.xtream},
    });
  }

  return entries;
};

export const SourceScreen = ({onSelect, error}: SourceScreenProps) => {
  const entries = buildEntries();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vega IPTV</Text>
      <Text style={styles.subtitle}>Choisis une source de chaînes</Text>

      {error !== null && (
        <View style={styles.errorBox} testID="source-error">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TVFocusGuideView style={styles.list}>
        <ScrollView contentContainerStyle={styles.listContent}>
          {entries.map((entry, index) => (
            <FocusableCard
              key={entry.key}
              testID={`source-${entry.key}`}
              title={entry.title}
              subtitle={entry.subtitle}
              hasTVPreferredFocus={index === 0}
              style={styles.card}
              onPress={() => onSelect(entry.source)}
            />
          ))}
        </ScrollView>
      </TVFocusGuideView>

      {entries.length === 1 && (
        <Text style={styles.hint}>
          Renseigne src/devConfig.ts pour ajouter ta playlist M3U ou ton portail
          Xtream.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.hero,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    marginTop: spacing.xs,
  },
  list: {
    flex: 1,
    marginTop: spacing.lg,
    maxWidth: 900,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  card: {
    marginBottom: spacing.md,
    minHeight: 110,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  errorBox: {
    marginTop: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.danger,
    padding: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.caption,
  },
});
