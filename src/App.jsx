// import React, { useRef, useEffect, useState } from 'react';
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import Cube from "./Cube";

// const App = () => {
//   const mountRef = useRef(null);
//   const [cubeSize, setCubeSize] = useState(3);
//   const [cubeState, setCubeState] = useState([]);
//   const [selectedColor, setSelectedColor] = useState('#ffffff'); // Default color
//   const rotationInProgress = useRef(false);
//   const faceGroups = useRef({
//     right: new THREE.Group(),
//     left: new THREE.Group(),
//     top: new THREE.Group(),
//     bottom: new THREE.Group(),
//     front: new THREE.Group(),
//     back: new THREE.Group()
//   });
//   const cubeletMeshes = useRef([]);
//   const sceneRef = useRef(null);
//   const rendererRef = useRef(null);
//   const cameraRef = useRef(null);
//   const controlsRef = useRef(null);

//   const availableColors = [
//     { color: '#ffffff', name: 'White' },
//     { color: '#ff0000', name: 'Red' },
//     { color: '#ff8c00', name: 'Orange' },
//     { color: '#ffff00', name: 'Yellow' },
//     { color: '#00ff00', name: 'Green' },
//     { color: '#0000ff', name: 'Blue' },
//     { color: '#000000', name: 'Black' }
//   ];

//   function createInitialCubeState(size) {
//     const state = [];
//     const offset = (size - 1) / 2;
    
//     for (let x = 0; x < size; x++) {
//       for (let y = 0; y < size; y++) {
//         for (let z = 0; z < size; z++) {
//           // Skip internal cubes
//           if (x > 0 && x < size - 1 && 
//               y > 0 && y < size - 1 && 
//               z > 0 && z < size - 1) continue;
          
//           // Store cubelet position and face colors - initialize all to white
//           state.push({
//             position: { x: x - offset, y: y - offset, z: z - offset },
//             originalPosition: { x, y, z },
//             colors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff']
//           });
//         }
//       }
//     }
//     console.log('state', state);
//     return state;
//   }

//   useEffect(() => {
//     // Reset the state when cube size changes
//     const initialState = createInitialCubeState(cubeSize);
//     setCubeState(initialState);
//   }, [cubeSize]);

//   useEffect(() => {
//     if (mountRef.current) {
//       while (mountRef.current.firstChild) {
//         mountRef.current.removeChild(mountRef.current.firstChild);
//       }
//     }

//     if (!mountRef.current || cubeState.length === 0) return;

//     // Setup
//     const scene = new THREE.Scene();
//     scene.background = new THREE.Color(0xf0f0f0);
//     sceneRef.current = scene;
    
//     const camera = new THREE.PerspectiveCamera(
//       45, 
//       mountRef.current.clientWidth / mountRef.current.clientHeight, 
//       0.1, 
//       1000
//     );
//     camera.position.set(7, 5, 7);
//     cameraRef.current = camera;
    
//     const renderer = new THREE.WebGLRenderer({ antialias: true });
//     renderer.setPixelRatio(window.devicePixelRatio);
//     renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
//     mountRef.current.appendChild(renderer.domElement);
//     rendererRef.current = renderer;
    
//     // Lighting
//     const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
//     scene.add(ambientLight);
    
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
//     directionalLight.position.set(3, 3, 3);
//     scene.add(directionalLight);
    
//     // Controls
//     const controls = new OrbitControls(camera, renderer.domElement);
//     controls.enableZoom = true; 
//     controls.enablePan = false;
//     controls.enableDamping = true;
//     controls.dampingFactor = 0.2;
//     controlsRef.current = controls;
    
//     // Function to create bordered texture
//     function createBorderedTexture(centerColor = '#ffffff', borderColor = '#000000') {
//       const size = 250;
//       const canvas = document.createElement('canvas');
//       canvas.width = size;
//       canvas.height = size;
//       const ctx = canvas.getContext('2d');
//       // Fill border
//       ctx.fillStyle = borderColor;
//       ctx.fillRect(0, 0, size, size);
//       // Fill center
//       const border = 20;
//       ctx.fillStyle = centerColor;
//       ctx.fillRect(border, border, size - 2 * border, size - 2 * border);
//       return new THREE.CanvasTexture(canvas);
//     }
    
//     // Create Rubik's Cube
//     const cubeGroup = new THREE.Group();
//     scene.add(cubeGroup);

//     // Create and add face groups to main cube
//     Object.keys(faceGroups.current).forEach(face => {
//       faceGroups.current[face] = new THREE.Group();
//       cubeGroup.add(faceGroups.current[face]);
//     });
    
//     // Create cubes
//     const size = 1;
//     cubeletMeshes.current = [];

//     cubeState.forEach((cubelet, index) => {
//       const geometry = new THREE.BoxGeometry(size, size, size);
      
//       // Create materials based on current state
//       const materials = cubelet.colors.map((color) => {
//         return new THREE.MeshStandardMaterial({ 
//           map: createBorderedTexture(color), 
//           roughness: 0.7 
//         });
//       });
      
//       const mesh = new THREE.Mesh(geometry, materials);
//       mesh.position.set(
//         cubelet.position.x * size,
//         cubelet.position.y * size,
//         cubelet.position.z * size
//       );
      
//       // Store original indices for reference
//       mesh.userData = {
//         cubeStateIndex: index,
//         position: { ...cubelet.position }
//       };
      
//       cubeletMeshes.current.push(mesh);

//       // Add to appropriate face groups
//       const { x, y, z } = cubelet.position;
//       const threshold = (cubeSize - 1) / 2;
      
//       if (x === threshold) faceGroups.current.right.add(mesh);
//       if (x === -threshold) faceGroups.current.left.add(mesh);
//       if (y === threshold) faceGroups.current.top.add(mesh);
//       if (y === -threshold) faceGroups.current.bottom.add(mesh);
//       if (z === threshold) faceGroups.current.front.add(mesh);
//       if (z === -threshold) faceGroups.current.back.add(mesh);
      
//       // Also add to main cube group
//       cubeGroup.add(mesh);
//     });

//     // Raycaster for mouse picking
//     const raycaster = new THREE.Raycaster();
//     const mouse = new THREE.Vector2();

//     const handleMouseClick = (event) => {
//       if (rotationInProgress.current) return;
      
//       // Calculate mouse position in normalized device coordinates
//       const rect = renderer.domElement.getBoundingClientRect();
//       mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
//       mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
//       // Update the picking ray with the camera and mouse position
//       raycaster.setFromCamera(mouse, camera);
      
//       // Calculate objects intersecting the picking ray
//       const intersects = raycaster.intersectObjects(cubeletMeshes.current);
      
//       if (intersects.length > 0) {
//         const intersect = intersects[0];
//         const cubelet = intersect.object;
        
//         // Determine which face of the cube was clicked
//         const faceIndex = intersect.faceIndex;
//         const normalizedFaceIndex = Math.floor(faceIndex / 2);
        
//         // Get the cube state index
//         const cubeStateIndex = cubelet.userData.cubeStateIndex;
        
//         // Update the color in the cube state
//         const newCubeState = [...cubeState];
//         newCubeState[cubeStateIndex].colors[normalizedFaceIndex] = selectedColor;
//         setCubeState(newCubeState);
        
//         // Update the material directly for immediate visual feedback
//         updateCubeletMaterial(cubelet, normalizedFaceIndex, selectedColor);
//       }
//     };

//     // Function to update a single face material
//     function updateCubeletMaterial(cubelet, faceIndex, color) {
//       // Create and set a new material for the specific face
//       const newMaterial = new THREE.MeshStandardMaterial({ 
//         map: createBorderedTexture(color), 
//         roughness: 0.7 
//       });
      
//       // Create a new array of materials
//       const newMaterials = [...cubelet.material];
//       newMaterials[faceIndex] = newMaterial;
      
//       // Update the entire materials array
//       cubelet.material = newMaterials;
//     }

//     // Add event listener for mouse clicks
//     renderer.domElement.addEventListener('click', handleMouseClick);

//     // Animation loop
//     let animationId;
//     const animate = () => {
//       animationId = requestAnimationFrame(animate);
//       controls.update();
//       renderer.render(scene, camera);
//     };
    
//     animate();
      
//     // Resize handler
//     const handleResize = () => {
//       if (!mountRef.current) return;
      
//       camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
//     };
    
//     window.addEventListener('resize', handleResize);
    
//     // Cleanup
//     return () => {
//       renderer.domElement.removeEventListener('click', handleMouseClick);
//       window.removeEventListener('resize', handleResize);
      
//       cancelAnimationFrame(animationId);
      
//       if (mountRef.current && renderer.domElement) {
//         mountRef.current.removeChild(renderer.domElement);
//       }
      
//       // Dispose resources
//       scene.traverse((object) => {
//         if (object instanceof THREE.Mesh) {
//           object.geometry.dispose();
          
//           if (Array.isArray(object.material)) {
//             object.material.forEach(material => {
//               if (material.map) material.map.dispose();
//               material.dispose();
//             });
//           } else {
//             if (object.material.map) object.material.map.dispose();
//             object.material.dispose();
//           }
//         }
//       });
      
//       renderer.dispose();
//       controls.dispose();
//     };
//   }, [cubeSize, cubeState, selectedColor]);
  
//   // Reset the cube to all white
//   const resetCube = () => {
//     setCubeState(createInitialCubeState(cubeSize));
//   };

//   // Rotate the entire cube
//   const rotateCube = (direction) => {
//     if (!controlsRef.current) return;
    
//     rotationInProgress.current = true;
    
//     // Store current rotation
//     const startQuaternion = new THREE.Quaternion().copy(controlsRef.current.object.quaternion);
    
//     // Determine target rotation
//     let targetQuaternion = new THREE.Quaternion();
    
//     const rotationAxis = new THREE.Vector3();
//     const rotationAngle = Math.PI / 2; // 90 degrees
    
//     switch (direction) {
//       case 'left':
//         rotationAxis.set(0, 1, 0); // Y-axis
//         break;
//       case 'right':
//         rotationAxis.set(0, -1, 0); // Negative Y-axis
//         break;
//       case 'up':
//         rotationAxis.set(1, 0, 0); // X-axis
//         break;
//       default:
//         break;
//     }
    
//     if (direction === 'up') {
//       targetQuaternion.setFromAxisAngle(rotationAxis, Math.PI); // 180 degrees
//     } else {
//       targetQuaternion.setFromAxisAngle(rotationAxis, rotationAngle);
//     }
    
//     // Combine with current rotation
//     targetQuaternion.multiply(startQuaternion);
    
//     // Animation duration
//     const duration = 500; // milliseconds
//     const startTime = Date.now();
    
//     function animateRotation() {
//       const elapsed = Date.now() - startTime;
//       const progress = Math.min(elapsed / duration, 1);
      
//       // Slerp between current and target rotation
//       const currentQuaternion = new THREE.Quaternion();
//       // FIX: Use instance method slerpQuaternions instead of static Quaternion.slerp
//       currentQuaternion.slerpQuaternions(startQuaternion, targetQuaternion, easeInOutQuad(progress));
      
//       // Apply to camera
//       controlsRef.current.object.quaternion.copy(currentQuaternion);
//       controlsRef.current.update();
      
//       if (progress < 1) {
//         requestAnimationFrame(animateRotation);
//       } else {
//         rotationInProgress.current = false;
//       }
//     }
    
//     // Start animation
//     animateRotation();
//   };
   
//   // Easing function for smooth animation
//   function easeInOutQuad(t) {
//     return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
//   }
  
//   return (
//     <div className="flex flex-col items-center w-full">
//       <div className="bg-gray-100 p-4 rounded-lg shadow-md w-full max-w-xl mb-4">
//         <div className="flex justify-between items-center mb-4">
//           <div className="w-1/2">
//             <label htmlFor="cubeSize" className="block text-sm font-medium text-gray-700 mb-1">
//               Cube Size: {cubeSize}×{cubeSize}×{cubeSize}
//             </label>
//             <input
//               id="cubeSize"
//               type="range"
//               min="2"
//               max="4"
//               value={cubeSize}
//               onChange={(e) => setCubeSize(parseInt(e.target.value))}
//               className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
//             />
//           </div>
//           <button
//             onClick={resetCube}
//             className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//           >
//             Reset Cube
//           </button>
//         </div>
        
//         {/* Color selector */}
//         <div className="mb-4">
//           <div className="text-sm font-medium text-gray-700 mb-2">
//             Select Color:
//           </div>
//           <div className="flex flex-wrap gap-2">
//             {availableColors.map((color) => (
//               <button
//                 key={color.color}
//                 onClick={() => setSelectedColor(color.color)}
//                 className={`w-8 h-8 rounded-full border-2 ${selectedColor === color.color ? 'border-blue-500' : 'border-gray-300'}`}
//                 style={{ backgroundColor: color.color }}
//                 title={color.name}
//               />
//             ))}
//           </div>
//         </div>
        
//         {/* Cube rotation controls */}
//         <div className="mb-4">
//           <div className="text-sm font-medium text-gray-700 mb-2">
//             Cube Rotation:
//           </div>
//           <div className="flex gap-2">
//             <button
//               onClick={() => rotateCube('left')}
//               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               Rotate Left
//             </button>
//             <button
//               onClick={() => rotateCube('right')}
//               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               Rotate Right
//             </button>
//             <button
//               onClick={() => rotateCube('up')}
//               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               Rotate Up
//             </button>
//             <button onClick={()=> console.log(cubeState)}>
//               state
//             </button>
//           </div>
//         </div>
//       </div>
      
//       <div 
//         ref={mountRef} 
//         className="w-full h-96 bg-gray-100 rounded-lg shadow-lg mb-4"
//       />
      
//       <div className="text-sm text-gray-600 mt-2">
//         Click on a cube face to color it with the selected color.
//       </div>
//     </div>
//   );
// };

// export default App;

const App = () => {
  return(
    <div>
      < Cube />
    </div>
  )
}

export default App;