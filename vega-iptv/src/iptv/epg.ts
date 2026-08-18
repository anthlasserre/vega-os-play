import {EpgEntry} from './types';

export interface NowNext {
  now: EpgEntry | null;
  next: EpgEntry | null;
}

export const selectNowNext = (entries: EpgEntry[], at: Date): NowNext => {
  const sorted = [...entries].sort((a, b) => a.start.getTime() - b.start.getTime());
  const time = at.getTime();

  const now =
    sorted.find(
      entry => entry.start.getTime() <= time && entry.end.getTime() > time,
    ) ?? null;
  const next = sorted.find(entry => entry.start.getTime() > time) ?? null;

  return {now, next};
};

/** Avancement d'un programme en cours, borné à [0, 1]. */
export const progressOf = (entry: EpgEntry, at: Date): number => {
  const span = entry.end.getTime() - entry.start.getTime();
  if (span <= 0) {
    return 0;
  }
  const elapsed = at.getTime() - entry.start.getTime();
  return Math.min(1, Math.max(0, elapsed / span));
};

const pad = (value: number): string => String(value).padStart(2, '0');

export const formatClock = (date: Date): string =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const formatSlot = (entry: EpgEntry): string =>
  `${formatClock(entry.start)} – ${formatClock(entry.end)}`;
