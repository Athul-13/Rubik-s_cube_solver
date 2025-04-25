import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/js/controls/OrbitControls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import RoundedBoxGeometry from './utils/roundedBoxGeometry'
import { RoundedPlaneGeometry } from './utils/roundedBoxGeometry';

const RubiksCube = ({ theme, size }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cubeRef = useRef(null);

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
        // Dispose resources
      }
    };
  }, [size, theme]);

  const initScene = () => {
    // Mock game world structure that the original Cube class expects
    sceneRef.current = {
      world: {
        scene: new THREE.Scene()
      },
      controls: {
        group: new THREE.Group(),
        edges: new THREE.Group()
      },
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
      storage: { clearGame: () => {} }
    };

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    // renderer.setClearColor(new THREE.Color('#f0f0f0'), 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Add camera
    const camera = new THREE.PerspectiveCamera(
      50, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(3, 2.5, 3);
    camera.lookAt(0, 0, 0);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(2, 5, 3);
    sceneRef.current.world.scene.add(ambientLight, directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(sceneRef.current.world.scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);
  };

  const initCube = () => {
    cubeRef.current = new Cube(sceneRef.current);
    cubeRef.current.init();
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
      </div>
    </div>
  );
};

// Cube class adapted from your code
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
      this.game.timer.reset();
      this.game.storage.clearGame();
    }
  }

  reset() {
    this.game.controls.edges.rotation.set(0, 0, 0);

    this.holder.rotation.set(0, 0, 0);
    this.object.rotation.set(0, 0, 0);
    this.animator.rotation.set(0, 0, 0);
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

  loadFromData(data) {
    this.size = data.size;

    this.reset();
    this.init();

    this.pieces.forEach(piece => {
      const index = data.names.indexOf(piece.name);

      const position = data.positions[index];
      const rotation = data.rotations[index];

      piece.position.set(position.x, position.y, position.z);
      piece.rotation.set(rotation.x, rotation.y, rotation.z);
    });
  }

  rotateLeft() {
    this.animateRotation('y', Math.PI / 2); // 90 deg left
  }
  
  rotateRight() {
    this.animateRotation('y', -Math.PI / 2); // 90 deg right
  }
  
  rotateUp() {
    this.animateRotation('x', Math.PI); // 180 deg up
  }
  
  animateRotation(axis, targetDelta, duration = 500) {
    if (this.isRotating) return;
    this.isRotating = true;
  
    const startTime = performance.now();
    const startRotation = this.animator.rotation[axis];
    const endRotation = startRotation + targetDelta;
  
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easedT = t * (2 - t);
  
      this.animator.rotation[axis] = startRotation + (endRotation - startRotation) * easedT;
  
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.animator.rotation[axis] = Math.round(endRotation * 100) / 100; // Snap to clean value
        this.isRotating = false;
      }
    };
  
    requestAnimationFrame(animate);
  }
  
}

export default RubiksCube;