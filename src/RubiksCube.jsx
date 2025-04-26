import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import RoundedBoxGeometry from './utils/roundedBoxGeometry';
import { RoundedPlaneGeometry } from './utils/roundedBoxGeometry';
import Draggable from './utils/Draggable';

const RubiksCube = ({ theme, size }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cubeRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    // Initialize Three.js scene
    if (!sceneRef.current) {
      initScene();
    }

    // Create or resize cube when size changes
    if (cubeRef.current) {
      cubeRef.current.resize(size !== cubeRef.current.sizeGenerated);
    } else {
      initCube();
    }

    // Update colors when theme changes
    if (cubeRef.current && theme) {
      cubeRef.current.updateColors(theme);
    }

    return () => {
      // Cleanup when component unmounts
      if (sceneRef.current) {
        // Clean up event listeners
        if (controlsRef.current?.draggable) {
          controlsRef.current.draggable.disable();
        }
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [size, theme]);

  const handleResize = () => {
    const camera = sceneRef.current.camera;
    const renderer = sceneRef.current.renderer;
    
    camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
  };

  const initScene = () => {
    // Create scene structure
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(3, 2.5, 3);
    camera.lookAt(0, 0, 0);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(2, 5, 3);
    scene.add(ambientLight, directionalLight);

    // Setup Controls
    controlsRef.current = new Controls(containerRef.current, scene, camera);

    // Store references
    sceneRef.current = {
      world: { scene },
      camera,
      renderer,
      controls: controlsRef.current,
      themes: {
        getColors: () => theme || {
          P: 0x000000, // Piece color
          L: 0xff0000, // Left face
          R: 0xff9900, // Right face
          D: 0xffffff, // Down face
          U: 0xffff00, // Up face
          B: 0x0000ff, // Back face
          F: 0x00ff00  // Front face
        }
      },
      preferences: {
        ranges: {
          size: { value: size }
        }
      },
      saved: false,
      timer: { reset: () => {} },
      storage: { clearGame: () => {}, saveGame: () => {} }
    };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    window.addEventListener('resize', handleResize);
  };

  const initCube = () => {
    cubeRef.current = new Cube(sceneRef.current);
    cubeRef.current.init();
    
    // Connect the Controls to the Cube
    if (controlsRef.current) {
      controlsRef.current.connectToCube(cubeRef.current);
    }
  };

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
  
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        <button onClick={() => cubeRef.current.rotateLeft()} className="bg-white text-black px-4 py-2 rounded">
          Left
        </button>
        <button onClick={() => cubeRef.current.rotateRight()} className="bg-white text-black px-4 py-2 rounded">
          Right
        </button>
        <button onClick={() => cubeRef.current.rotateUp()} className="bg-white text-black px-4 py-2 rounded">
          Up
        </button>
        <button onClick={() => cubeRef.current.rotateFace('F')} className="bg-white text-black px-4 py-2 rounded">
          Front Face
        </button>
      </div>
    </div>
  );
};

class Controls {
  constructor(domElement, scene, camera) {
    this.domElement = domElement;
    this.scene = scene;
    this.camera = camera;
    
    this.group = new THREE.Group();
    this.edges = new THREE.Group();
    
    this.raycaster = new THREE.Raycaster();
    
    const helperMaterial = new THREE.MeshBasicMaterial({ 
      depthWrite: false, 
      transparent: true, 
      opacity: 0, 
      color: 0x0033ff 
    });
    
    this.helper = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      helperMaterial.clone()
    );
    
    this.helper.rotation.set(0, Math.PI / 4, 0);
    scene.add(this.helper);
    
    this.edges = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      helperMaterial.clone()
    );
    
    scene.add(this.edges);
    
    this.state = 'STILL'; // STILL, PREPARING, ROTATING, ANIMATING
    this.enabled = false;
    
    // Will be initialized when connected to a cube
    this.cube = null;
  }
  
  connectToCube(cube) {
    this.cube = cube;
    this.initDraggable();
    this.enable();
  }
  
  enable() {
    if (this.draggable) {
      this.draggable.enable();
      this.enabled = true;
    }
  }
  
  disable() {
    if (this.draggable) {
      this.draggable.disable();
      this.enabled = false;
    }
  }
  
  initDraggable() {
    if (!this.domElement) return;
    
    this.draggable = new Draggable(this.domElement);
    
    this.draggable.onDragStart = position => {
      if (!this.enabled || !this.cube || this.state !== 'STILL') return;
      
      // Initialize drag operation
      console.log('Drag start at', position);
      
      this.dragCurrent = position.current.clone();
      this.dragTotal = new THREE.Vector2();
      this.state = 'PREPARING';
    };
    
    this.draggable.onDragMove = position => {
      if (!this.enabled || !this.cube || (this.state !== 'PREPARING' && this.state !== 'ROTATING')) return;
      
      // Handle drag movement
      const point = position.current.clone();
      
      this.dragDelta = point.clone().sub(this.dragCurrent);
      this.dragTotal.add(this.dragDelta);
      this.dragCurrent = point;
      
      if (this.state === 'PREPARING' && this.dragTotal.length() > 0.05) {
        // Determine drag direction
        this.dragDirection = this.getMainAxis(this.dragTotal);
        this.state = 'ROTATING';
        
        // Apply rotation based on drag direction
        console.log('Started rotating in direction:', this.dragDirection);
      } else if (this.state === 'ROTATING') {
        // Apply the rotation based on drag delta
        const rotation = this.dragDelta[this.dragDirection] * 0.01;
        
        // Apply rotation to the cube
        if (this.dragDirection === 'x') {
          this.cube.animateRotation('x', rotation, 0);
        } else if (this.dragDirection === 'y') {
          this.cube.animateRotation('y', rotation, 0);
        }
      }
    };
    
    this.draggable.onDragEnd = position => {
      if (!this.enabled || !this.cube) return;
      
      if (this.state === 'ROTATING') {
        // Complete the rotation to the nearest quarter turn
        const angle = this.roundAngle(this.dragTotal[this.dragDirection] * 0.01);
        console.log('Completing rotation to:', angle);
        
        this.state = 'ANIMATING';
        
        // Animate to the nearest quarter turn
        if (this.dragDirection === 'x') {
          this.cube.animateRotation('x', angle, 500, () => {
            this.state = 'STILL';
          });
        } else if (this.dragDirection === 'y') {
          this.cube.animateRotation('y', angle, 500, () => {
            this.state = 'STILL';
          });
        }
      } else {
        this.state = 'STILL';
      }
    };
  }
  
  getMainAxis(vector) {
    return Math.abs(vector.x) > Math.abs(vector.y) ? 'x' : 'y';
  }
  
  roundAngle(angle) {
    const round = Math.PI / 2;
    return Math.sign(angle) * Math.round(Math.abs(angle) / round) * round;
  }
  
  getIntersect(position, object, multiple) {
    this.raycaster.setFromCamera(
      this.draggable.convertPosition(position.clone()),
      this.camera
    );
    
    const intersect = (multiple)
      ? this.raycaster.intersectObjects(object)
      : this.raycaster.intersectObject(object);
    
    return (intersect.length > 0) ? intersect[0] : false;
  }
}

class Cube {
  constructor(game) {
    this.game = game;
    this.size = 3;

    this.geometry = {
      pieceCornerRadius: 0.12,
      edgeCornerRoundness: 0.15,
      edgeScale: 0.82,
      edgeDepth: 0.01,
    };

    this.holder = new THREE.Object3D();
    this.object = new THREE.Object3D();
    this.animator = new THREE.Object3D();

    this.holder.add(this.animator);
    this.animator.add(this.object);

    this.game.world.scene.add(this.holder);
    
    this.isRotating = false;
    this.pieces = [];
    this.edges = [];
    this.faceGroups = {
      F: new THREE.Group(), // Front
      B: new THREE.Group(), // Back
      U: new THREE.Group(), // Up
      D: new THREE.Group(), // Down
      R: new THREE.Group(), // Right
      L: new THREE.Group()  // Left
    };
  }

  init() {
    this.cubes = [];
    this.object.children = [];
    this.object.add(this.game.controls.group);

    if (this.size === 2) this.scale = 1.25;
    else if (this.size === 3) this.scale = 1;
    else if (this.size > 3) this.scale = 3 / this.size;

    this.object.scale.set(this.scale, this.scale, this.scale);

    const controlsScale = this.size === 2 ? 0.825 : 1;
    this.game.controls.edges.scale.set(controlsScale, controlsScale, controlsScale);
    
    this.generatePositions();
    this.generateModel();

    this.pieces.forEach(piece => {
      this.cubes.push(piece.userData.cube);
      this.object.add(piece);
      
      // Add piece to face groups based on its edges
      const edges = piece.userData.edges;
      if (edges) {
        edges.forEach(edge => {
          if (this.faceGroups[edge]) {
            this.faceGroups[edge].add(piece);
          }
        });
      }
    });

    this.holder.traverse(node => {
      if (node.frustumCulled) node.frustumCulled = false;
    });

    this.updateColors(this.game.themes.getColors());

    this.sizeGenerated = this.size;
  }

  resize(force = false) {
    if (this.size !== this.sizeGenerated || force) {
      this.size = this.game.preferences.ranges.size.value;

      this.reset();
      this.init();

      this.game.saved = false;
      if (this.game.timer?.reset) this.game.timer.reset();
      if (this.game.storage?.clearGame) this.game.storage.clearGame();
    }
  }

  reset() {
    this.game.controls.edges.rotation.set(0, 0, 0);

    this.holder.rotation.set(0, 0, 0);
    this.object.rotation.set(0, 0, 0);
    this.animator.rotation.set(0, 0, 0);
    
    // Reset face groups
    Object.values(this.faceGroups).forEach(group => {
      group.children = [];
    });
  }

  generatePositions() {
    const m = this.size - 1;
    const first = this.size % 2 !== 0
      ? 0 - Math.floor(this.size / 2)
      : 0.5 - this.size / 2;

    let x, y, z;

    this.positions = [];

    for (x = 0; x < this.size; x++) {
      for (y = 0; y < this.size; y++) {
        for (z = 0; z < this.size; z++) {
          let position = new THREE.Vector3(first + x, first + y, first + z);
          let edges = [];

          if (x == 0) edges.push(0);
          if (x == m) edges.push(1);
          if (y == 0) edges.push(2);
          if (y == m) edges.push(3);
          if (z == 0) edges.push(4);
          if (z == m) edges.push(5);

          position.edges = edges;
          this.positions.push(position);
        }
      }
    }
  }

  generateModel() {
    this.pieces = [];
    this.edges = [];

    const pieceSize = 1 / 3;

    const mainMaterial = new THREE.MeshLambertMaterial();

    const pieceMesh = new THREE.Mesh(
      new RoundedBoxGeometry(pieceSize, this.geometry.pieceCornerRadius, 3),
      mainMaterial.clone()
    );

    const edgeGeometry = RoundedPlaneGeometry(
      pieceSize,
      this.geometry.edgeCornerRoundness,
      this.geometry.edgeDepth
    );

    this.positions.forEach((position, index) => {
      const piece = new THREE.Object3D();
      const pieceCube = pieceMesh.clone();
      const pieceEdges = [];

      piece.position.copy(position.clone().divideScalar(3));
      piece.add(pieceCube);
      piece.name = index;
      piece.edgesName = '';

      position.edges.forEach(position => {
        const edge = new THREE.Mesh(edgeGeometry, mainMaterial.clone());
        const name = ['L', 'R', 'D', 'U', 'B', 'F'][position];
        const distance = pieceSize / 2;

        edge.position.set(
          distance * [-1, 1, 0, 0, 0, 0][position],
          distance * [0, 0, -1, 1, 0, 0][position],
          distance * [0, 0, 0, 0, -1, 1][position]
        );

        edge.rotation.set(
          Math.PI / 2 * [0, 0, 1, -1, 0, 0][position],
          Math.PI / 2 * [-1, 1, 0, 0, 2, 0][position],
          0
        );

        edge.scale.set(
          this.geometry.edgeScale,
          this.geometry.edgeScale,
          this.geometry.edgeScale
        );

        edge.name = name;

        piece.add(edge);
        pieceEdges.push(name);
        this.edges.push(edge);
      });

      piece.userData.edges = pieceEdges;
      piece.userData.cube = pieceCube;

      piece.userData.start = {
        position: piece.position.clone(),
        rotation: piece.rotation.clone(),
      };

      this.pieces.push(piece);
    });
  }

  updateColors(colors) {
    if (typeof this.pieces !== 'object' && typeof this.edges !== 'object') return;

    this.pieces.forEach(piece => piece.userData.cube.material.color.setHex(colors.P));
    this.edges.forEach(edge => edge.material.color.setHex(colors[edge.name]));
  }

  rotateLeft() {
    this.animateRotation('y', Math.PI / 2); // 90 deg left
  }
  
  rotateRight() {
    this.animateRotation('y', -Math.PI / 2); // 90 deg right
  }
  
  rotateUp() {
    this.animateRotation('x', Math.PI / 2); // 90 deg up
  }
  
  // Rotate a specific face of the cube
  rotateFace(face, direction = 1) {
    if (this.isRotating) return;
    
    const faceGroup = this.faceGroups[face];
    if (!faceGroup || faceGroup.children.length === 0) {
      // If the face group isn't populated yet, find pieces that should be in it
      this.populateFaceGroup(face);
    }
    
    // Define rotation axis and angle based on the face
    let axis, angle;
    
    switch(face) {
      case 'F': // Front face rotates around Z
        axis = 'z';
        angle = -Math.PI/2 * direction;
        break;
      case 'B': // Back face rotates around Z (opposite direction)
        axis = 'z';
        angle = Math.PI/2 * direction;
        break;
      case 'U': // Up face rotates around Y
        axis = 'y';
        angle = -Math.PI/2 * direction;
        break;
      case 'D': // Down face rotates around Y (opposite direction)
        axis = 'y';
        angle = Math.PI/2 * direction;
        break;
      case 'R': // Right face rotates around X
        axis = 'x';
        angle = Math.PI/2 * direction;
        break;
      case 'L': // Left face rotates around X (opposite direction)
        axis = 'x';
        angle = -Math.PI/2 * direction;
        break;
    }
    
    if (axis && angle) {
      this.animateFaceRotation(face, axis, angle);
    }
  }
  
  // Populate a face group with the appropriate pieces
  populateFaceGroup(face) {
    const faceGroup = this.faceGroups[face];
    faceGroup.children = [];
    
    // Find pieces that belong to this face
    this.pieces.forEach(piece => {
      if (piece.userData.edges && piece.userData.edges.includes(face)) {
        faceGroup.add(piece);
      }
    });
  }
  
  // Animate rotation of a specific face
  animateFaceRotation(face, axis, angle, duration = 500) {
    if (this.isRotating) return;
    this.isRotating = true;
    
    const faceGroup = this.faceGroups[face];
    if (!faceGroup || faceGroup.children.length === 0) {
      this.populateFaceGroup(face);
    }
    
    // Create a temporary group to rotate the face pieces
    const rotationGroup = new THREE.Group();
    this.object.add(rotationGroup);
    
    // Add all pieces of this face to the rotation group
    const piecesToRotate = [];
    faceGroup.children.forEach(piece => {
      const originalParent = piece.parent;
      const worldPos = new THREE.Vector3();
      const worldRot = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();
      
      // Get world position/rotation/scale
      piece.updateMatrixWorld();
      piece.getWorldPosition(worldPos);
      piece.getWorldQuaternion(worldRot);
      piece.getWorldScale(worldScale);
      
      // Remove from original parent
      originalParent.remove(piece);
      
      // Add to rotation group
      rotationGroup.add(piece);
      
      // Store original info for later reassembly
      piecesToRotate.push({
        piece,
        originalParent
      });
    });
    
    // Animate the rotation
    const startTime = performance.now();
    
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easedT = t * (2 - t); // easeOutQuad
      
      rotationGroup.rotation[axis] = angle * easedT;
      
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - reassemble the cube
        rotationGroup.updateMatrixWorld();
        
        piecesToRotate.forEach(({ piece, originalParent }) => {
          const worldPos = new THREE.Vector3();
          const worldRot = new THREE.Quaternion();
          const worldScale = new THREE.Vector3();
          
          // Get world position/rotation/scale after rotation
          piece.updateMatrixWorld();
          piece.getWorldPosition(worldPos);
          piece.getWorldQuaternion(worldRot);
          piece.getWorldScale(worldScale);
          
          // Remove from rotation group
          rotationGroup.remove(piece);
          
          // Add back to original parent
          originalParent.add(piece);
          
          // Set new position/rotation/scale
          piece.position.copy(worldPos);
          piece.quaternion.copy(worldRot);
          piece.scale.copy(worldScale);
          
          // Transform back to local space of parent
          originalParent.updateMatrixWorld();
          const parentWorldInverse = new THREE.Matrix4().copy(originalParent.matrixWorld).invert();
          piece.applyMatrix4(parentWorldInverse);
        });
        
        // Remove the temporary rotation group
        this.object.remove(rotationGroup);
        
        this.isRotating = false;
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  animateRotation(axis, targetDelta, duration = 500, callback) {
    if (this.isRotating && duration > 0) return;
    this.isRotating = true;
  
    // For instant rotations (during drag)
    if (duration === 0) {
      this.animator.rotation[axis] += targetDelta;
      this.isRotating = false;
      return;
    }
  
    const startTime = performance.now();
    const startRotation = this.animator.rotation[axis];
    const endRotation = startRotation + targetDelta;
  
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easedT = t * (2 - t); // easeOutQuad
  
      this.animator.rotation[axis] = startRotation + (targetDelta * easedT);
  
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.animator.rotation[axis] = endRotation; // Ensure we land exactly at the target
        this.isRotating = false;
        if (callback) callback();
      }
    };
  
    requestAnimationFrame(animate);
  }
}

// Simple Draggable class implementation
// class Draggable {
//   constructor(domElement) {
//     this.element = domElement;
//     this.enabled = false;
//     this.position = {
//       current: new THREE.Vector2(),
//       start: new THREE.Vector2(),
//       delta: new THREE.Vector2(),
//       old: new THREE.Vector2()
//     };
    
//     this.touch = {
//       active: false,
//       intersects: false
//     };
    
//     this.onDragStart = () => {};
//     this.onDragMove = () => {};
//     this.onDragEnd = () => {};
    
//     this.attachListeners();
//   }
  
//   attachListeners() {
//     this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
//     window.addEventListener('mousemove', this.onMouseMove.bind(this));
//     window.addEventListener('mouseup', this.onMouseUp.bind(this));
    
//     this.element.addEventListener('touchstart', this.onTouchStart.bind(this));
//     window.addEventListener('touchmove', this.onTouchMove.bind(this));
//     window.addEventListener('touchend', this.onTouchEnd.bind(this));
//   }
  
//   enable() {
//     this.enabled = true;
//   }
  
//   disable() {
//     this.enabled = false;
//   }
  
//   convertPosition(position) {
//     const rect = this.element.getBoundingClientRect();
    
//     return new THREE.Vector2(
//       ((position.x - rect.left) / rect.width) * 2 - 1,
//       -((position.y - rect.top) / rect.height) * 2 + 1
//     );
//   }
  
//   onMouseDown(event) {
//     if (!this.enabled) return;
    
//     this.touch.active = true;
//     this.position.start.set(event.clientX, event.clientY);
//     this.position.current.copy(this.position.start);
//     this.position.old.copy(this.position.start);
    
//     this.onDragStart(this.position);
//   }
  
//   onMouseMove(event) {
//     if (!this.enabled || !this.touch.active) return;
    
//     this.position.old.copy(this.position.current);
//     this.position.current.set(event.clientX, event.clientY);
//     this.position.delta.subVectors(this.position.current, this.position.old);
    
//     this.onDragMove(this.position);
//   }
  
//   onMouseUp(event) {
//     if (!this.enabled || !this.touch.active) return;
    
//     this.touch.active = false;
    
//     this.onDragEnd(this.position);
//   }
  
//   onTouchStart(event) {
//     if (!this.enabled || event.touches.length !== 1) return;
    
//     this.touch.active = true;
//     this.position.start.set(event.touches[0].clientX, event.touches[0].clientY);
//     this.position.current.copy(this.position.start);
//     this.position.old.copy(this.position.start);
    
//     this.onDragStart(this.position);
//   }
  
//   onTouchMove(event) {
//     if (!this.enabled || !this.touch.active || event.touches.length !== 1) return;
    
//     event.preventDefault();
    
//     this.position.old.copy(this.position.current);
//     this.position.current.set(event.touches[0].clientX, event.touches[0].clientY);
//     this.position.delta.subVectors(this.position.current, this.position.old);
    
//     this.onDragMove(this.position);
//   }
  
//   onTouchEnd(event) {
//     if (!this.enabled || !this.touch.active) return;
    
//     this.touch.active = false;
    
//     this.onDragEnd(this.position);
//   }
// }

export default RubiksCube;