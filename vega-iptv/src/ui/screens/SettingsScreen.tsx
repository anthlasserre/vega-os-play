import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from '../components/ActionButton';
import {AccountInfo, Source} from '../../iptv/types';
import {PersistedState} from '../../storage/schema';
import {formatDate} from '../format';
import {colors, fontSize, radius, spacing} from '../../theme';

export interface SettingsScreenProps {
  state: PersistedState;
  source: Source;
  account: AccountInfo | null;
  onToggleLayout: () => void;
  onToggleResume: () => void;
  onClearHistory: () => void;
  onReloadCatalog: () => void;
  onOpenSources: () => void;
  onBack: () => void;
}

export const SettingsScreen = ({
  state,
  source,
  account,
  onToggleLayout,
  onToggleResume,
  onClearHistory,
  onReloadCatalog,
  onOpenSources,
  onBack,
}: SettingsScreenProps) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <Text style={styles.title}>Réglages</Text>

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

    <TVFocusGuideView style={styles.actions}>
      <ActionButton
        testID="settings-sources"
        label="Gérer les sources"
        hasTVPreferredFocus={true}
        onPress={onOpenSources}
        style={styles.action}
      />
      <ActionButton
        testID="settings-layout"
        label={`Affichage : ${state.settings.layout === 'grid' ? 'grille' : 'liste'}`}
        onPress={onToggleLayout}
        style={styles.action}
      />
      <ActionButton
        testID="settings-resume"
        label={`Reprise auto : ${state.settings.resumePlayback ? 'oui' : 'non'}`}
        onPress={onToggleResume}
        style={styles.action}
      />
      <ActionButton
        testID="settings-reload"
        label="Recharger le catalogue"
        onPress={onReloadCatalog}
        style={styles.action}
      />
      <ActionButton
        testID="settings-clear"
        label={`Vider l'historique (${state.progress.length})`}
        tone="danger"
        onPress={onClearHistory}
        style={styles.action}
      />
      <ActionButton testID="settings-back" label="Retour" onPress={onBack} style={styles.action} />
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
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    maxWidth: 900,
  },
  cardTitle: {
    color: colors.accent,
    fontSize: fontSize.micro,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  line: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  muted: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 1200,
  },
  action: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    minWidth: 280,
  },
});
