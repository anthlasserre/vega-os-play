/**
 * Playlist embarquée pour le mode dev : aucune credential requise.
 *
 * Volontairement écrite en M3U brut plutôt qu'en objets — le mode démo exerce
 * ainsi le vrai parseur, pas un chemin de code parallèle.
 *
 * Les entrées MP4 se lisent avec le moteur URL fourni par le SDK Vega.
 * Les entrées HLS ont besoin du moteur MSE (voir src/player/shaka/index.ts).
 */
export const DEMO_M3U = `#EXTM3U
#EXTINF:-1 tvg-id="demo.bbb" tvg-logo="" group-title="Démo · MP4",Big Buck Bunny
https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4
#EXTINF:-1 tvg-id="demo.jellyfish" tvg-logo="" group-title="Démo · MP4",Jellyfish
https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4
#EXTINF:-1 tvg-id="demo.sintel" tvg-logo="" group-title="Démo · MP4",Sintel
https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_5MB.mp4
#EXTINF:-1 tvg-id="demo.mux" tvg-logo="" group-title="Démo · HLS",Mux — Big Buck Bunny (HLS)
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
#EXTINF:-1 tvg-id="demo.apple" tvg-logo="" group-title="Démo · HLS",Apple BipBop (HLS)
https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8
#EXTINF:-1 tvg-id="demo.tos" tvg-logo="" group-title="Démo · HLS",Tears of Steel (HLS)
https://test-streams.mux.dev/tos_ismc/main.m3u8
`;
