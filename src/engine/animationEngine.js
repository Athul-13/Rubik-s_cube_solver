let uniqueID = 0;

class AnimationEngine {
  constructor() {
    this.ids = [];
    this.animations = {};
    this.update = this.update.bind(this);
    this.raf = 0;
    this.time = 0;
  }

  update() {
    const now = performance.now();
    const delta = now - this.time;
    this.time = now;

    this.raf = this.ids.length ? requestAnimationFrame(this.update) : 0;

    for (let i = this.ids.length - 1; i >= 0; i--) {
      this.animations[this.ids[i]]?.update(delta);
    }
  }

  add(animation) {
    animation.id = uniqueID++;
    this.ids.push(animation.id);
    this.animations[animation.id] = animation;

    if (this.raf === 0) {
      this.time = performance.now();
      this.raf = requestAnimationFrame(this.update);
    }
  }

  remove(animation) {
    const index = this.ids.indexOf(animation.id);
    if (index >= 0) {
      this.ids.splice(index, 1);
      delete this.animations[animation.id];
    }
  }
}

const animationEngine = new AnimationEngine();
export default animationEngine;
