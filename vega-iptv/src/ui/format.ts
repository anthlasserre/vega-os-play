const pad = (value: number): string => String(value).padStart(2, '0');

/** hh:mm:ss quand il y a des heures, mm:ss sinon. */
export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '--:--';
  }
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(rest)}`
    : `${pad(minutes)}:${pad(rest)}`;
};

export const formatDate = (date: Date | null | undefined): string => {
  if (date === null || date === undefined || Number.isNaN(date.getTime())) {
    return 'illimité';
  }
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export const formatCount = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count > 1 ? plural : singular}`;

export const formatTime = (epochMs: number): string => {
  const date = new Date(epochMs);
  return Number.isNaN(date.getTime())
    ? '--:--'
    : `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * « Aujourd'hui », « Hier », puis la date.
 *
 * Comparaison sur les jours calendaires et non sur un écart en heures : à 1 h du
 * matin, ce qu'on a regardé à 23 h relève bien d'« Hier », pas d'« Aujourd'hui ».
 * Le paramètre `now` est là pour rendre la fonction testable.
 */
export const formatRelativeDay = (
  epochMs: number,
  now: Date = new Date(),
): string => {
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) {
    return 'date inconnue';
  }

  const startOfDay = (value: Date): number =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (days === 0) {
    return "aujourd'hui";
  }
  if (days === 1) {
    return 'hier';
  }
  if (days > 1 && days < 7) {
    return `il y a ${days} jours`;
  }
  return formatDate(date);
};
