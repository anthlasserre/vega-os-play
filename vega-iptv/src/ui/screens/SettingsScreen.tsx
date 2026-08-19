import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from '../components/ActionButton';
import {useLayout} from '../layout';
import {formatDate} from '../format';
import {AccountInfo, MediaKind, Source} from '../../iptv/types';
import {PersistedState} from '../../storage/schema';
import {colors, fontSize, radius, spacing} from '../../theme';

export interface SettingsScreenProps {
  state: PersistedState;
  source: Source;
  account: AccountInfo | null;
  onToggleLayout: () => void;
  onToggleResume: () => void;
  onCycleLiveBuffer: () => void;
  onClearResume: () => void;
  onClearHistory: () => void;
  onOpenHistory: () => void;
  onOpenFilter: (kind: MediaKind) => void;
  onReloadCatalog: () => void;
  onOpenSources: () => void;
  onBack: () => void;
}

/** Lecture du compromis, pour que le réglage ne soit pas un nombre opaque. */
const bufferHint = (seconds: number): string => {
  if (seconds <= 2) {
    return 'zapping instantané, coupe sur un réseau irrégulier';
  }
  if (seconds <= 5) {
    return 'zapping rapide, peu de marge';
  }
  if (seconds <= 10) {
    return 'équilibré';
  }
  if (seconds <= 20) {
    return 'stable, démarrage plus lent';
  }
  return 'très stable, zapping lent';
};

const Section = ({title, children}: {title: string; children: React.ReactNode}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TVFocusGuideView style={styles.row}>{children}</TVFocusGuideView>
  </View>
);

export const SettingsScreen = ({
  state,
  source,
  account,
  onToggleLayout,
  onToggleResume,
  onCycleLiveBuffer,
  onClearResume,
  onClearHistory,
  onOpenHistory,
  onOpenFilter,
  onReloadCatalog,
  onOpenSources,
  onBack,
}: SettingsScreenProps) => {
  const metrics = useLayout();
  const {settings} = state;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingHorizontal: metrics.gutter,
        paddingVertical: metrics.vGutter,
      }}>
      <View style={styles.header}>
        <Text style={styles.title}>Réglages</Text>
        <ActionButton
          testID="settings-back"
          label="Retour"
          icon="back"
          iconOnly={true}
          onPress={onBack}
          hasTVPreferredFocus={true}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Source active</Text>
        <Text style={styles.line}>{source.label}</Text>
        {account === null ? (
          <Text style={styles.muted}>
            Cette source n'expose pas d'informations de compte.
          </Text>
        ) : (
          <>
            <Text style={styles.line} testID="settings-account">
              {account.username}
              {account.status === undefined ? '' : ` · ${account.status}`}
              {account.trial === true ? ' · essai' : ''}
            </Text>
            <Text style={styles.muted}>
              Expire le {formatDate(account.expiresAt)}
              {account.maxConnections === undefined
                ? ''
                : ` · ${account.activeConnections ?? 0}/${account.maxConnections} connexions`}
            </Text>
          </>
        )}
      </View>

      <Section title="Lecture">
        <ActionButton
          testID="settings-buffer"
          label={`Tampon direct : ${settings.liveBufferSeconds} s`}
          icon="buffer"
          onPress={onCycleLiveBuffer}
          style={styles.action}
        />
        <ActionButton
          testID="settings-resume"
          label={`Reprise auto : ${settings.resumePlayback ? 'oui' : 'non'}`}
          icon="play"
          onPress={onToggleResume}
          style={styles.action}
        />
      </Section>
      <Text style={styles.hint} testID="settings-buffer-hint">
        {bufferHint(settings.liveBufferSeconds)}
      </Text>

      <Section title="Affichage">
        <ActionButton
          testID="settings-layout"
          label={`Films et séries : ${settings.layout === 'grid' ? 'grille' : 'liste'}`}
          icon={settings.layout === 'grid' ? 'grid' : 'list'}
          onPress={onToggleLayout}
          style={styles.action}
        />
      </Section>

      <Section title="Catégories affichées">
        <ActionButton
          testID="settings-filter-live"
          label="Direct"
          icon="live"
          onPress={() => onOpenFilter('live')}
          style={styles.action}
        />
        <ActionButton
          testID="settings-filter-movie"
          label="Films"
          icon="movie"
          onPress={() => onOpenFilter('movie')}
          style={styles.action}
        />
        <ActionButton
          testID="settings-filter-series"
          label="Séries"
          icon="series"
          onPress={() => onOpenFilter('series')}
          style={styles.action}
        />
      </Section>

      <Section title="Historique et reprise">
        <ActionButton
          testID="settings-history"
          label={`Historique (${state.history.length})`}
          icon="history"
          onPress={onOpenHistory}
          style={styles.action}
        />
        <ActionButton
          testID="settings-clear-resume"
          label={`Oublier les reprises (${state.progress.length})`}
          icon="close"
          tone="danger"
          onPress={onClearResume}
          style={styles.action}
        />
        <ActionButton
          testID="settings-clear-history"
          label="Vider l'historique"
          icon="trash"
          tone="danger"
          onPress={onClearHistory}
          style={styles.action}
        />
      </Section>

      <Section title="Sources">
        <ActionButton
          testID="settings-sources"
          label="Gérer les sources"
          icon="source"
          onPress={onOpenSources}
          style={styles.action}
        />
        <ActionButton
          testID="settings-reload"
          label="Recharger le catalogue"
          icon="reload"
          onPress={onReloadCatalog}
          style={styles.action}
        />
      </Section>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    maxWidth: 560,
  },
  cardTitle: {
    color: colors.accent,
    fontSize: fontSize.micro,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  line: {
    color: colors.text,
    fontSize: fontSize.caption,
  },
  muted: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  action: {
    marginRight: spacing.xs,
    marginBottom: spacing.xxs,
  },
  hint: {
    color: colors.textDim,
    fontSize: fontSize.micro,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
});
