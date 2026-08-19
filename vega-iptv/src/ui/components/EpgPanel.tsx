import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {EpgEntry} from '../../iptv/types';
import {formatSlot, progressOf, selectNowNext} from '../../iptv/epg';
import {colors, fontSize, radius, spacing} from '../../theme';

export interface EpgPanelProps {
  channelName: string | null;
  entries: EpgEntry[];
  loading: boolean;
  /** Absent = la source ne fournit pas d'EPG (M3U, démo). */
  supported: boolean;
  now: Date;
}

export const EpgPanel = ({
  channelName,
  entries,
  loading,
  supported,
  now,
}: EpgPanelProps) => {
  if (!supported) {
    return (
      <View style={styles.panel}>
        <Text style={styles.hint} testID="epg-unsupported">
          Cette source ne fournit pas de guide des programmes. L'EPG demande un
          portail Xtream.
        </Text>
      </View>
    );
  }

  if (channelName === null) {
    return (
      <View style={styles.panel}>
        <Text style={styles.hint}>Sélectionne une chaîne pour voir son programme.</Text>
      </View>
    );
  }

  const {now: current, next} = selectNowNext(entries, now);

  return (
    <View style={styles.panel} testID="epg-panel">
      <Text style={styles.channel} numberOfLines={1}>
        {channelName}
      </Text>

      {loading && <ActivityIndicator color={colors.accent} style={styles.loader} />}

      {!loading && current === null && next === null && (
        <Text style={styles.hint}>Aucun programme annoncé.</Text>
      )}

      {current !== null && (
        <View style={styles.block}>
          <Text style={styles.label}>En cours</Text>
          <Text style={styles.programme} numberOfLines={2}>
            {current.title}
          </Text>
          <Text style={styles.slot}>{formatSlot(current)}</Text>
          <View style={styles.track}>
            <View
              style={[styles.fill, {width: `${progressOf(current, now) * 100}%`}]}
            />
          </View>
          {current.description !== undefined && (
            <Text style={styles.description} numberOfLines={5}>
              {current.description}
            </Text>
          )}
        </View>
      )}

      {next !== null && (
        <View style={styles.block}>
          <Text style={styles.label}>À suivre</Text>
          <Text style={styles.programme} numberOfLines={2}>
            {next.title}
          </Text>
          <Text style={styles.slot}>{formatSlot(next)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  channel: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  loader: {
    alignSelf: 'flex-start',
  },
  block: {
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.accent,
    fontSize: fontSize.micro,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  programme: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  slot: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
    marginTop: 2,
  },
  track: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: spacing.xs,
  },
  fill: {
    height: 4,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  description: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
    marginTop: spacing.xs,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
  },
});
