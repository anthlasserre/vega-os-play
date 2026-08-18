import React, {useState} from 'react';
import {FlatList, ScrollView, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from '../components/ActionButton';
import {MediaCard} from '../components/MediaCard';
import {TextField} from '../components/TextField';
import {Source} from '../../iptv/types';
import {colors, fontSize, spacing} from '../../theme';

export interface SourcesScreenProps {
  sources: Source[];
  activeSourceId: string | null;
  onSelect: (sourceId: string) => void;
  onAdd: (source: Source) => void;
  onRemove: (sourceId: string) => void;
  onBack: () => void;
}

type Draft = 'xtream' | 'm3u';

const describe = (source: Source): string => {
  switch (source.kind) {
    case 'demo':
      return 'Playlist embarquée';
    case 'm3u':
      return source.url;
    case 'xtream':
      return `${source.host} · ${source.username}`;
  }
};

/** Identifiant stable et lisible, dérivé du libellé saisi. */
const slugify = (label: string, kind: Draft): string => {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${kind}-${base === '' ? 'source' : base}`;
};

export const SourcesScreen = ({
  sources,
  activeSourceId,
  onSelect,
  onAdd,
  onRemove,
  onBack,
}: SourcesScreenProps) => {
  const [draft, setDraft] = useState<Draft>('xtream');
  const [label, setLabel] = useState('');
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const trimmedLabel = label.trim();
    if (trimmedLabel === '') {
      setError('Donne un nom à la source.');
      return;
    }

    if (draft === 'xtream') {
      if (host.trim() === '' || username.trim() === '' || password.trim() === '') {
        setError('Hôte, identifiant et mot de passe sont requis.');
        return;
      }
      onAdd({
        id: slugify(trimmedLabel, 'xtream'),
        kind: 'xtream',
        label: trimmedLabel,
        host: host.trim(),
        username: username.trim(),
        password: password.trim(),
      });
    } else {
      if (url.trim() === '') {
        setError("L'URL de la playlist est requise.");
        return;
      }
      onAdd({
        id: slugify(trimmedLabel, 'm3u'),
        kind: 'm3u',
        label: trimmedLabel,
        url: url.trim(),
      });
    }

    setError(null);
    setLabel('');
    setHost('');
    setUsername('');
    setPassword('');
    setUrl('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sources</Text>

      <View style={styles.body}>
        <TVFocusGuideView style={styles.list}>
          <FlatList
            data={sources}
            keyExtractor={source => source.id}
            initialNumToRender={10}
            windowSize={5}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            renderItem={({item, index}) => (
              <View style={styles.sourceRow}>
                <MediaCard
                  testID={`source-${item.id}`}
                  title={`${item.id === activeSourceId ? '● ' : ''}${item.label}`}
                  subtitle={describe(item)}
                  layout="list"
                  hasTVPreferredFocus={index === 0}
                  onPress={() => onSelect(item.id)}
                  style={[
                    styles.sourceCard,
                    item.id === activeSourceId && styles.sourceActive,
                  ]}
                />
                {item.kind !== 'demo' && (
                  <ActionButton
                    testID={`source-remove-${item.id}`}
                    label="Supprimer"
                    tone="danger"
                    onPress={() => onRemove(item.id)}
                    style={styles.remove}
                  />
                )}
              </View>
            )}
          />
        </TVFocusGuideView>

        <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
          <Text style={styles.formTitle}>Ajouter une source</Text>

          <TVFocusGuideView style={styles.kindRow}>
            <ActionButton
              testID="draft-xtream"
              label="Xtream Codes"
              onPress={() => setDraft('xtream')}
              style={[styles.kind, draft === 'xtream' && styles.kindActive]}
            />
            <ActionButton
              testID="draft-m3u"
              label="Playlist M3U"
              onPress={() => setDraft('m3u')}
              style={[styles.kind, draft === 'm3u' && styles.kindActive]}
            />
          </TVFocusGuideView>

          <TextField
            testID="field-label"
            label="Nom"
            value={label}
            onChangeText={setLabel}
            placeholder="Mon abonnement"
          />

          {draft === 'xtream' ? (
            <>
              <TextField
                testID="field-host"
                label="Hôte"
                value={host}
                onChangeText={setHost}
                placeholder="http://portail.exemple:8080"
                keyboardType="url"
              />
              <TextField
                testID="field-username"
                label="Identifiant"
                value={username}
                onChangeText={setUsername}
              />
              <TextField
                testID="field-password"
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secure={true}
              />
            </>
          ) : (
            <TextField
              testID="field-url"
              label="URL de la playlist"
              value={url}
              onChangeText={setUrl}
              placeholder="https://exemple.com/playlist.m3u"
              keyboardType="url"
            />
          )}

          {error !== null && (
            <Text style={styles.error} testID="sources-error">
              {error}
            </Text>
          )}

          <TVFocusGuideView style={styles.actions}>
            <ActionButton testID="source-submit" label="Ajouter" onPress={submit} style={styles.action} />
            <ActionButton testID="sources-back" label="Retour" onPress={onBack} style={styles.action} />
          </TVFocusGuideView>
        </ScrollView>
      </View>
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
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  list: {
    flex: 1,
    marginRight: spacing.lg,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sourceCard: {
    flex: 1,
  },
  sourceActive: {
    borderColor: colors.accent,
  },
  remove: {
    marginLeft: spacing.xs,
    minWidth: 150,
  },
  form: {
    width: 620,
  },
  formContent: {
    paddingBottom: spacing.md,
  },
  formTitle: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  kindRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  kind: {
    marginRight: spacing.xs,
  },
  kindActive: {
    borderColor: colors.accent,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.caption,
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  action: {
    marginRight: spacing.sm,
  },
});
