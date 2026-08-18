/** Formes brutes renvoyées par `player_api.php`. Champs volontairement laxistes :
 *  les panels Xtream renvoient indifféremment nombres ou chaînes. */

export type Numeric = number | string;

export interface RawCategory {
  category_id?: Numeric;
  category_name?: string;
}

export interface RawLiveStream {
  stream_id?: Numeric;
  name?: string;
  stream_icon?: string;
  epg_channel_id?: string;
  category_id?: Numeric;
  tv_archive?: Numeric;
  tv_archive_duration?: Numeric;
}

export interface RawVodStream {
  stream_id?: Numeric;
  name?: string;
  stream_icon?: string;
  category_id?: Numeric;
  container_extension?: string;
  rating?: Numeric;
}

export interface RawVodInfo {
  info?: {
    movie_image?: string;
    plot?: string;
    genre?: string;
    releasedate?: string;
    rating?: Numeric;
    duration_secs?: Numeric;
  };
  movie_data?: {
    stream_id?: Numeric;
    name?: string;
    container_extension?: string;
  };
}

export interface RawSeries {
  series_id?: Numeric;
  name?: string;
  cover?: string;
  plot?: string;
  genre?: string;
  releaseDate?: string;
  rating?: Numeric;
  category_id?: Numeric;
}

export interface RawEpisode {
  id?: Numeric;
  episode_num?: Numeric;
  title?: string;
  container_extension?: string;
  season?: Numeric;
  info?: {
    movie_image?: string;
    plot?: string;
    duration_secs?: Numeric;
  };
}

export interface RawSeriesInfo {
  episodes?: Record<string, RawEpisode[]>;
}

export interface RawUserInfo {
  user_info?: {
    username?: string;
    status?: string;
    exp_date?: Numeric | null;
    is_trial?: Numeric;
    active_cons?: Numeric;
    max_connections?: Numeric;
    auth?: Numeric;
  };
}

export interface RawEpgListing {
  title?: string;
  description?: string;
  start_timestamp?: Numeric;
  stop_timestamp?: Numeric;
}

export interface RawShortEpg {
  epg_listings?: RawEpgListing[];
}
