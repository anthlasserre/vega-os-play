// Stub navigateur du VideoPlayer W3C : assez d'API pour que le hook déroule son
// cycle de vie et émette ses événements, sans jamais toucher au décodeur natif.
export class VideoPlayer {
  constructor() {
    this.autoplay = false;
    this.src = '';
    this.paused = true;
    this.error = null;
    this.listeners = new Map();
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
  }
  pause() {
    this.paused = true;
    this.emit('pause');
  }
}
