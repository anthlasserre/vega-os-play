/**
 * Configuration du mode dev.
 *
 * Volontairement un fichier plutôt qu'un formulaire : saisir une URL ou des
 * identifiants à la télécommande est pénible et ajoute une surface clavier
 * qu'un POC n'a pas besoin de valider. Renseigne ce qui t'intéresse, relance
 * Metro, la source apparaît sur l'écran d'accueil.
 */
export const devConfig = {
  /** URL d'une playlist M3U / M3U8 étendue. Laisser vide pour masquer la source. */
  m3uUrl: '',

  /** Portail Xtream Codes. Laisser `host` vide pour masquer la source. */
  xtream: {
    host: '',
    username: '',
    password: '',
  },
};
