// Stub navigateur du VideoPlayer W3C : assez d'API pour que le hook déroule son
// cycle de vie, émette ses événements et expose des pistes, sans jamais toucher
// au décodeur natif.
const track = (id, label, language, extra) => ({id, label, language, ...extra});

export class VideoPlayer {
  constructor() {
    this.autoplay = false;
    this.src = '';
    this.paused = true;
    this.error = null;
    this.currentTime = 0;
    this.duration = 5400;
    this.listeners = new Map();
    this.audioTracks = {
      length: 2,
      0: track('a1', 'VF Dolby 5.1', 'fra', {enabled: true}),
      1: track('a2', '', 'eng', {enabled: false}),
    };
    this.textTracks = {
      length: 2,
      0: track('t1', 'Français', 'fra', {mode: 'disabled'}),
      1: track('t2', 'Forcés', 'fra', {mode: 'disabled'}),
    };
  }
  async initialize() {}
  async deinitialize() {}
  addEventListener(type, listener) {
    const bucket = this.listeners.get(type) ?? [];
    bucket.push(listener);
    this.listeners.set(type, bucket);
  }
  removeEventListener(type, listener) {
    const bucket = this.listeners.get(type) ?? [];
    this.listeners.set(
      type,
      bucket.filter(entry => entry !== listener),
    );
  }
  emit(type) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({type});
    }
  }
  setSurfaceHandle() {}
  clearSurfaceHandle() {}
  play() {
    this.paused = false;
    this.emit('playing');
    this.emit('loadedmetadata');
  }
  pause() {
    this.paused = true;
    this.emit('pause');
  }
}
