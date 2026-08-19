/**
 * Traduction des erreurs de lecture en message affichable.
 *
 * Un `shaka.util.Error` n'est pas une `Error` JavaScript : c'est un objet nu
 * portant `severity`, `category`, `code` et un tableau `data` où atterrissent
 * l'URL, le statut HTTP et parfois plusieurs kilo-octets d'en-têtes de réponse.
 * Passé à `String()`, il vomit ce contenu à l'écran — ce que l'app faisait,
 * remplissant le lecteur de JSON à la première coupure réseau.
 *
 * On rend donc une phrase courte, plus le code d'origine entre parenthèses :
 * l'utilisateur sait quoi faire, et le code reste là pour diagnostiquer.
 */

/** Catégories de `shaka.util.Error.Category`. */
const CATEGORY_MESSAGES: Record<number, string> = {
  1: 'Le serveur du portail ne répond pas correctement.',
  2: 'Les sous-titres de ce flux sont illisibles.',
  3: 'Le décodeur a refusé ce flux.',
  4: 'Le manifeste de ce flux est illisible.',
  5: 'La diffusion a été interrompue.',
  6: 'Ce contenu est protégé et la licence a été refusée.',
  7: 'Le lecteur a rencontré une erreur interne.',
};

/**
 * Codes valant un message spécifique.
 *
 * Volontairement court : seuls ceux qu'un utilisateur d'IPTV rencontre vraiment,
 * et pour lesquels la cause probable diffère du message de catégorie.
 */
const CODE_MESSAGES: Record<number, string> = {
  1001: 'Le portail a refusé la requête.',
  1002: 'Erreur réseau en récupérant le flux.',
  1003: 'Le portail met trop de temps à répondre.',
  1004: 'Le portail a coupé la connexion.',
  3016: 'Le décodeur a échoué sur ce flux (codec non pris en charge ?).',
  4000: 'Format de flux non reconnu.',
  4032: 'Ce flux ne contient aucune piste lisible.',
  6001: 'Contenu protégé : DRM non pris en charge.',
};

/** Un statut HTTP dans `data` en dit souvent plus que le code Shaka. */
const HTTP_MESSAGES: Record<number, string> = {
  401: "Identifiants refusés par le portail.",
  403: 'Accès refusé par le portail.',
  404: "Cette chaîne n'existe plus côté portail.",
  407: 'Le portail exige une authentification (limite de connexions atteinte ?).',
  429: 'Trop de requêtes : le portail limite le débit.',
  500: 'Panne côté portail.',
  502: 'Passerelle du portail en erreur.',
  503: 'Portail momentanément indisponible.',
};

/**
 * `MediaError` du HTMLMediaElement, dont les codes vont de 1 à 4.
 *
 * À ne pas confondre avec un code Shaka : le lecteur W3C signale ses propres
 * échecs par cet objet, et un « code 3 » y veut dire « décodage impossible »,
 * pas la troisième catégorie Shaka.
 */
const MEDIA_ERROR_MESSAGES: Record<number, string> = {
  1: 'Lecture interrompue.',
  2: 'Le flux a été coupé côté réseau.',
  3: 'Flux illisible : le décodeur a échoué.',
  4: "Ce flux n'est pas lisible (format non pris en charge, ou entrée vide).",
};

interface ShakaLikeError {
  code: number;
  category?: number;
  data?: unknown[];
}

const isShakaError = (value: unknown): value is ShakaLikeError =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ShakaLikeError).code === 'number';

/**
 * Un `MediaError` se reconnaît à ce qu'il n'a ni `category` ni `data` — les deux
 * champs que Shaka renseigne toujours — et à son code dans la plage 1–4.
 */
const isMediaError = (value: ShakaLikeError): boolean =>
  value.category === undefined &&
  value.data === undefined &&
  value.code >= 1 &&
  value.code <= 4;

/**
 * Cherche un statut HTTP dans `data`.
 *
 * Shaka y place l'URL en premier puis, selon le code, le statut. On balaie donc
 * les entrées numériques plausibles plutôt que de se fier à une position.
 */
const httpStatusIn = (data: unknown[] | undefined): number | undefined => {
  if (data === undefined) {
    return undefined;
  }
  for (const entry of data) {
    if (typeof entry === 'number' && entry >= 400 && entry <= 599) {
      return entry;
    }
  }
  return undefined;
};

/** Plafond de longueur : un message d'erreur ne doit jamais remplir l'écran. */
export const MAX_ERROR_LENGTH = 160;

const truncate = (value: string): string =>
  value.length <= MAX_ERROR_LENGTH
    ? value
    : `${value.slice(0, MAX_ERROR_LENGTH - 1)}…`;

/** Contexte de la lecture, quand il précise la cause d'un échec. */
export interface PlaybackContext {
  /** Conteneur en majuscules (`MKV`, `MP4`…), tel que `containerOf()` le rend. */
  container?: string;
  /** Vrai si ce conteneur est connu pour être refusé par le lecteur Vega. */
  risky?: boolean;
}

/**
 * `MEDIA_ERR_SRC_NOT_SUPPORTED` est le code que renvoie le lecteur autant sur une
 * URL morte que sur un conteneur qu'il ne sait pas démultiplexer. Quand le
 * conteneur est justement l'un de ceux qui posent problème, le nommer épargne à
 * l'utilisateur une enquête inutile.
 */
const notSupportedMessage = (context: PlaybackContext | undefined): string => {
  if (context?.risky === true && context.container !== undefined) {
    return `Le lecteur Vega a refusé ce fichier ${context.container}. Ce conteneur n'est pas décodé en lecture directe.`;
  }
  if (context?.container !== undefined && context.container !== '') {
    return `Flux ${context.container} illisible : format refusé, ou adresse invalide.`;
  }
  return MEDIA_ERROR_MESSAGES[4];
};

export const describePlaybackError = (
  cause: unknown,
  context?: PlaybackContext,
): string => {
  if (isShakaError(cause)) {
    if (isMediaError(cause)) {
      return cause.code === 4
        ? notSupportedMessage(context)
        : MEDIA_ERROR_MESSAGES[cause.code];
    }

    const status = httpStatusIn(cause.data);
    const message =
      (status === undefined ? undefined : HTTP_MESSAGES[status]) ??
      CODE_MESSAGES[cause.code] ??
      (cause.category === undefined
        ? undefined
        : CATEGORY_MESSAGES[cause.category]) ??
      'Lecture impossible.';

    const details = [`code ${cause.code}`];
    if (status !== undefined) {
      details.push(`HTTP ${status}`);
    }
    return `${message} (${details.join(', ')})`;
  }

  if (cause instanceof Error && cause.message !== '') {
    return truncate(cause.message);
  }

  if (typeof cause === 'string' && cause !== '') {
    return truncate(cause);
  }

  return 'Lecture impossible.';
};
