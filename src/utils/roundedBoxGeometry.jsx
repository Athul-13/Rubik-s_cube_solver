import * as THREE from 'three';

export default class RoundedBoxGeometry extends THREE.BufferGeometry {
  constructor(size, radius, radiusSegments = 1) {
    super();
  
    this.type = 'RoundedBoxGeometry';
  
    // Ensure radiusSegments is at least 1
    radiusSegments = !isNaN(radiusSegments) ? Math.max(1, Math.floor(radiusSegments)) : 1;
  
    // For a cube, all dimensions are the same
    const width = size;
    const height = size;
    const depth = size;
    
    // Calculate corner radius based on size
    radius = size * radius;
    
    // Ensure radius isn't too large for the cube
    radius = Math.min(radius, Math.min(width, Math.min(height, Math.min(depth))) / 2);
  
    const edgeHalfWidth = width / 2 - radius;
    const edgeHalfHeight = height / 2 - radius;
    const edgeHalfDepth = depth / 2 - radius;
  
    this.parameters = {
      width: width,
      height: height,
      depth: depth,
      radius: radius,
      radiusSegments: radiusSegments
    };
  
    const rs1 = radiusSegments + 1;
    const totalVertexCount = (rs1 * radiusSegments + 1) << 3;
  
    const positions = new THREE.BufferAttribute(new Float32Array(totalVertexCount * 3), 3);
    const normals = new THREE.BufferAttribute(new Float32Array(totalVertexCount * 3), 3);
  
    const cornerVerts = [];
    const cornerNormals = [];
    const normal = new THREE.Vector3();
    const vertex = new THREE.Vector3();
    const vertexPool = [];
    const normalPool = [];
    const indices = [];
  
    const lastVertex = rs1 * radiusSegments;
    const cornerVertNumber = rs1 * radiusSegments + 1;
  
    doVertices();
    doFaces();
    doCorners();
    doHeightEdges();
    doWidthEdges();
    doDepthEdges();
  
    function doVertices() {
      const cornerLayout = [
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(1, 1, -1),
        new THREE.Vector3(-1, 1, -1),
        new THREE.Vector3(-1, 1, 1),
        new THREE.Vector3(1, -1, 1),
        new THREE.Vector3(1, -1, -1),
        new THREE.Vector3(-1, -1, -1),
        new THREE.Vector3(-1, -1, 1)
      ];
  
      for (let j = 0; j < 8; j++) {
        cornerVerts.push([]);
        cornerNormals.push([]);
      }
  
      const PIhalf = Math.PI / 2;
      const cornerOffset = new THREE.Vector3(edgeHalfWidth, edgeHalfHeight, edgeHalfDepth);
  
      for (let y = 0; y <= radiusSegments; y++) {
        const v = y / radiusSegments;
        const va = v * PIhalf;
        const cosVa = Math.cos(va);
        const sinVa = Math.sin(va);
  
        if (y === radiusSegments) {
          vertex.set(0, 1, 0);
          const vert = vertex.clone().multiplyScalar(radius).add(cornerOffset);
          cornerVerts[0].push(vert);
          vertexPool.push(vert);
          const norm = vertex.clone();
          cornerNormals[0].push(norm);
          normalPool.push(norm);
          continue;
        }
  
        for (let x = 0; x <= radiusSegments; x++) {
          const u = x / radiusSegments;
          const ha = u * PIhalf;
          vertex.x = cosVa * Math.cos(ha);
          vertex.y = sinVa;
          vertex.z = cosVa * Math.sin(ha);
  
          const vert = vertex.clone().multiplyScalar(radius).add(cornerOffset);
          cornerVerts[0].push(vert);
          vertexPool.push(vert);
  
          const norm = vertex.clone().normalize();
          cornerNormals[0].push(norm);
          normalPool.push(norm);
        }
      }
  
      for (let i = 1; i < 8; i++) {
        for (let j = 0; j < cornerVerts[0].length; j++) {
          const vert = cornerVerts[0][j].clone().multiply(cornerLayout[i]);
          cornerVerts[i].push(vert);
          vertexPool.push(vert);
  
          const norm = cornerNormals[0][j].clone().multiply(cornerLayout[i]);
          cornerNormals[i].push(norm);
          normalPool.push(norm);
        }
      }
    }
  
    function doCorners() {
      const flips = [
        true,
        false,
        true,
        false,
        false,
        true,
        false,
        true
      ];
  
      const lastRowOffset = rs1 * (radiusSegments - 1);
  
      for (let i = 0; i < 8; i++) {
        const cornerOffset = cornerVertNumber * i;
  
        for (let v = 0; v < radiusSegments - 1; v++) {
          const r1 = v * rs1;
          const r2 = (v + 1) * rs1;
  
          for (let u = 0; u < radiusSegments; u++) {
            const u1 = u + 1;
            const a = cornerOffset + r1 + u;
            const b = cornerOffset + r1 + u1;
            const c = cornerOffset + r2 + u;
            const d = cornerOffset + r2 + u1;
  
            if (!flips[i]) {
              indices.push(a);
              indices.push(b);
              indices.push(c);
  
              indices.push(b);
              indices.push(d);
              indices.push(c);
            } else {
              indices.push(a);
              indices.push(c);
              indices.push(b);
  
              indices.push(b);
              indices.push(c);
              indices.push(d);
            }
          }
        }
  
        for (let u = 0; u < radiusSegments; u++) {
          const a = cornerOffset + lastRowOffset + u;
          const b = cornerOffset + lastRowOffset + u + 1;
          const c = cornerOffset + lastVertex;
  
          if (!flips[i]) {
            indices.push(a);
            indices.push(b);
            indices.push(c);
          } else {
            indices.push(a);
            indices.push(c);
            indices.push(b);
          }
        }
      }
    }
  
    function doFaces() {
      let a = lastVertex;
      let b = lastVertex + cornerVertNumber;
      let c = lastVertex + cornerVertNumber * 2;
      let d = lastVertex + cornerVertNumber * 3;
  
      indices.push(a);
      indices.push(b);
      indices.push(c);
      indices.push(a);
      indices.push(c);
      indices.push(d);
  
      a = lastVertex + cornerVertNumber * 4;
      b = lastVertex + cornerVertNumber * 5;
      c = lastVertex + cornerVertNumber * 6;
      d = lastVertex + cornerVertNumber * 7;
  
      indices.push(a);
      indices.push(c);
      indices.push(b);
      indices.push(a);
      indices.push(d);
      indices.push(c);
  
      a = 0;
      b = cornerVertNumber;
      c = cornerVertNumber * 4;
      d = cornerVertNumber * 5;
  
      indices.push(a);
      indices.push(c);
      indices.push(b);
      indices.push(b);
      indices.push(c);
      indices.push(d);
  
      a = cornerVertNumber * 2;
      b = cornerVertNumber * 3;
      c = cornerVertNumber * 6;
      d = cornerVertNumber * 7;
  
      indices.push(a);
      indices.push(c);
      indices.push(b);
      indices.push(b);
      indices.push(c);
      indices.push(d);
  
      a = radiusSegments;
      b = radiusSegments + cornerVertNumber * 3;
      c = radiusSegments + cornerVertNumber * 4;
      d = radiusSegments + cornerVertNumber * 7;
  
      indices.push(a);
      indices.push(b);
      indices.push(c);
      indices.push(b);
      indices.push(d);
      indices.push(c);
  
      a = radiusSegments + cornerVertNumber;
      b = radiusSegments + cornerVertNumber * 2;
      c = radiusSegments + cornerVertNumber * 5;
      d = radiusSegments + cornerVertNumber * 6;
  
      indices.push(a);
      indices.push(c);
      indices.push(b);
      indices.push(b);
      indices.push(c);
      indices.push(d);
    }
  
    function doHeightEdges() {
      for (let i = 0; i < 4; i++) {
        const cOffset = i * cornerVertNumber;
        const cRowOffset = 4 * cornerVertNumber + cOffset;
        const needsFlip = i & 1 === 1;
  
        for (let u = 0; u < radiusSegments; u++) {
          const u1 = u + 1;
          const a = cOffset + u;
          const b = cOffset + u1;
          const c = cRowOffset + u;
          const d = cRowOffset + u1;
  
          if (!needsFlip) {
            indices.push(a);
            indices.push(b);
            indices.push(c);
            indices.push(b);
            indices.push(d);
            indices.push(c);
          } else {
            indices.push(a);
            indices.push(c);
            indices.push(b);
            indices.push(b);
            indices.push(c);
            indices.push(d);
          }
        }
      }
    }
  
    function doDepthEdges() {
      const cStarts = [0, 2, 4, 6];
      const cEnds = [1, 3, 5, 7];
  
      for (let i = 0; i < 4; i++) {
        const cStart = cornerVertNumber * cStarts[i];
        const cEnd = cornerVertNumber * cEnds[i];
  
        const needsFlip = 1 >= i;
  
        for (let u = 0; u < radiusSegments; u++) {
          const urs1 = u * rs1;
          const u1rs1 = (u + 1) * rs1;
  
          const a = cStart + urs1;
          const b = cStart + u1rs1;
          const c = cEnd + urs1;
          const d = cEnd + u1rs1;
  
          if (needsFlip) {
            indices.push(a);
            indices.push(c);
            indices.push(b);
            indices.push(b);
            indices.push(c);
            indices.push(d);
          } else {
            indices.push(a);
            indices.push(b);
            indices.push(c);
            indices.push(b);
            indices.push(d);
            indices.push(c);
          }
        }
      }
    }
  
    function doWidthEdges() {
      const end = radiusSegments - 1;
  
      const cStarts = [0, 1, 4, 5];
      const cEnds = [3, 2, 7, 6];
      const needsFlip = [0, 1, 1, 0];
  
      for (let i = 0; i < 4; i++) {
        const cStart = cStarts[i] * cornerVertNumber;
        const cEnd = cEnds[i] * cornerVertNumber;
  
        for (let u = 0; u <= end; u++) {
          const a = cStart + radiusSegments + u * rs1;
          const b = cStart + (u != end ? radiusSegments + (u + 1) * rs1 : cornerVertNumber - 1);
  
          const c = cEnd + radiusSegments + u * rs1;
          const d = cEnd + (u != end ? radiusSegments + (u + 1) * rs1 : cornerVertNumber - 1);
  
          if (!needsFlip[i]) {
            indices.push(a);
            indices.push(b);
            indices.push(c);
            indices.push(b);
            indices.push(d);
            indices.push(c);
          } else {
            indices.push(a);
            indices.push(c);
            indices.push(b);
            indices.push(b);
            indices.push(c);
            indices.push(d);
          }
        }
      }
    }
  
    let index = 0;
  
    for (let i = 0; i < vertexPool.length; i++) {
      positions.setXYZ(
        index,
        vertexPool[i].x,
        vertexPool[i].y,
        vertexPool[i].z
      );
  
      normals.setXYZ(
        index,
        normalPool[i].x,
        normalPool[i].y,
        normalPool[i].z
      );
  
      index++;
    }
  
    this.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    this.setAttribute('position', positions);
    this.setAttribute('normal', normals);
  }
}

// Helper function to create a rounded plane geometry
function RoundedPlaneGeometry(size, radius, depth) {
  // Center the plane at origin
  const x = -size / 2;
  const y = -size / 2;
  const width = size;
  const height = size;
  
  // Calculate corner radius based on size
  radius = size * radius;

  const shape = new THREE.Shape();

  shape.moveTo(x, y + radius);
  shape.lineTo(x, y + height - radius);
  shape.quadraticCurveTo(x, y + height, x + radius, y + height);
  shape.lineTo(x + width - radius, y + height);
  shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
  shape.lineTo(x + width, y + radius);
  shape.quadraticCurveTo(x + width, y, x + width - radius, y);
  shape.lineTo(x + radius, y);
  shape.quadraticCurveTo(x, y, x, y + radius);

  // Check which version of ExtrudeGeometry to use based on Three.js version
  const geometry = new THREE.ExtrudeGeometry(
    shape,
    { depth: depth, bevelEnabled: false, curveSegments: 3 }
  );

  return geometry;
}

export { RoundedPlaneGeometry };