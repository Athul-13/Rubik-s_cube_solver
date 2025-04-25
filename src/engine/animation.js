import animationEngine from './animationEngine';

export default class Animation {
  constructor(start = false) {
    if (start) this.start();
  }

  start() {
    animationEngine.add(this);
  }

  stop() {
    animationEngine.remove(this);
  }

  update(delta) {
    // To be overridden by subclasses like `World`
  }
}
