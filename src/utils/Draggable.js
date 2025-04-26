window.addEventListener('touchmove', () => {});
document.addEventListener('touchmove', event => { event.preventDefault(); }, { passive: false });

import * as THREE from 'three';

class Draggable {
    constructor(domElement) {
      this.element = domElement;
      this.enabled = false;
      this.position = {
        current: new THREE.Vector2(),
        start: new THREE.Vector2(),
        delta: new THREE.Vector2(),
        old: new THREE.Vector2()
      };
      
      this.touch = {
        active: false,
        intersects: false
      };
      
      this.onDragStart = () => {};
      this.onDragMove = () => {};
      this.onDragEnd = () => {};
      
      this.attachListeners();
    }
    
    attachListeners() {
      this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
      window.addEventListener('mousemove', this.onMouseMove.bind(this));
      window.addEventListener('mouseup', this.onMouseUp.bind(this));
      
      this.element.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
      window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
      window.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    }
    
    enable() {
      this.enabled = true;
    }
    
    disable() {
      this.enabled = false;
      this.touch.active = false;
    }
    
    convertPosition(position) {
      const rect = this.element.getBoundingClientRect();
      
      return new THREE.Vector2(
        ((position.x - rect.left) / rect.width) * 2 - 1,
        -((position.y - rect.top) / rect.height) * 2 + 1
      );
    }
    
    onMouseDown(event) {
      if (!this.enabled) return;
      
      this.touch.active = true;
      this.position.start.set(event.clientX, event.clientY);
      this.position.current.copy(this.position.start);
      this.position.old.copy(this.position.start);
      
      this.onDragStart(this.position);
    }
    
    onMouseMove(event) {
      if (!this.enabled || !this.touch.active) return;
      
      this.position.old.copy(this.position.current);
      this.position.current.set(event.clientX, event.clientY);
      this.position.delta.subVectors(this.position.current, this.position.old);
      
      this.onDragMove(this.position);
    }
    
    onMouseUp(event) {
      if (!this.enabled || !this.touch.active) return;
      
      this.touch.active = false;
      
      this.onDragEnd(this.position);
    }
    
    onTouchStart(event) {
      if (!this.enabled || event.touches.length !== 1) return;
      
      event.preventDefault();
      this.touch.active = true;
      this.position.start.set(event.touches[0].clientX, event.touches[0].clientY);
      this.position.current.copy(this.position.start);
      this.position.old.copy(this.position.start);
      
      this.onDragStart(this.position);
    }
    
    onTouchMove(event) {
      if (!this.enabled || !this.touch.active || event.touches.length !== 1) return;
      
      event.preventDefault();
      
      this.position.old.copy(this.position.current);
      this.position.current.set(event.touches[0].clientX, event.touches[0].clientY);
      this.position.delta.subVectors(this.position.current, this.position.old);
      
      this.onDragMove(this.position);
    }
    
    onTouchEnd(event) {
      if (!this.enabled || !this.touch.active) return;
      
      event.preventDefault();
      this.touch.active = false;
      
      this.onDragEnd(this.position);
    }
  }
  
  export default Draggable;