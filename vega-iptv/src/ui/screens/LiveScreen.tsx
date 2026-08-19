import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {CatalogBrowser} from '../components/CatalogBrowser';
import {EpgPanel} from '../components/EpgPanel';
import {loadChannelEpg} from '../../iptv/catalog';
import {
  Catalog,
  EpgEntry,
  LiveChannel,
  Source,
  mediaKey,
} from '../../iptv/types';
import {PersistedState} from '../../storage/schema';

export interface LiveScreenProps {
  catalog: Catalog;
  source: Source;
  state: PersistedState;
  /** Catégories masquées, affiché sur le bouton de filtrage. */
  hiddenCount: number;
  onOpenFilter: () => void;
  onPlay: (channel: LiveChannel) => void;
  onBack: () => void;
}

/** Laisse le temps de survoler la grille sans déclencher une requête par chaîne. */
const EPG_DEBOUNCE_MS = 500;

export const LiveScreen = ({
  catalog,
  source,
  state,
  hiddenCount,
  onOpenFilter,
  onPlay,
  onBack,
}: LiveScreenProps) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<EpgEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const requestRef = useRef(0);

  const channelById = useMemo(
    () => new Map(catalog.live.items.map((channel) => [channel.id, channel])),
    [catalog.live.items],
  );

  const focused =
    focusedId === null ? null : channelById.get(focusedId) ?? null;
  const focusedStreamId = focused?.streamId;

  // Horloge de l'EPG : la barre de progression du programme en cours doit
  // avancer même si l'utilisateur ne touche à rien.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (source.kind !== 'xtream' || focusedStreamId === undefined) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);

    const timer = setTimeout(() => {
      loadChannelEpg(source, focusedStreamId)
        .then((loaded) => {
          if (requestRef.current === requestId) {
            setEntries(loaded);
            setLoading(false);
          }
        })
        .catch(() => {
          if (requestRef.current === requestId) {
            setEntries([]);
            setLoading(false);
          }
        });
    }, EPG_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [source, focusedStreamId]);

  // Nom lisible plutôt qu'un identifiant numérique : la première version
  // affichait « 1363 » sous chaque chaîne, ce qui ne renseigne personne.
  const categoryNames = useMemo(
    () => new Map(catalog.live.categories.map(c => [c.id, c.name])),
    [catalog.live.categories],
  );

  const items = useMemo(
    () =>
      catalog.live.items.map((channel) => ({
        id: channel.id,
        title: channel.name,
        subtitle: categoryNames.get(channel.categoryId),
        image: channel.logo,
        badge:
          channel.archiveDays > 0 ? `↺ ${channel.archiveDays} j` : undefined,
        favorite: state.favorites.includes(mediaKey('live', channel.id)),
        categoryId: channel.categoryId,
      })),
    [catalog.live.items, categoryNames, state.favorites],
  );

  const handleSelect = useCallback(
    (id: string) => {
      const channel = channelById.get(id);
      if (channel !== undefined) {
        onPlay(channel);
      }
    },
    [channelById, onPlay],
  );

  return (
    <CatalogBrowser
      title="Direct"
      categories={catalog.live.categories}
      items={items}
      layout="list"
      showLogos={true}
      emptyLabel="Aucune chaîne dans cette catégorie."
      onSelect={handleSelect}
      onFocusItem={setFocusedId}
      onOpenFilter={onOpenFilter}
      hiddenCount={hiddenCount}
      onBack={onBack}
      aside={
        <EpgPanel
          channelName={focused?.name ?? null}
          entries={entries}
          loading={loading}
          supported={source.kind === 'xtream'}
          now={now}
        />
      }
    />
  );
};
