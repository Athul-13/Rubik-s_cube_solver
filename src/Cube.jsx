import React, { useState } from 'react';
import RubiksCube from './RubiksCube';

const Cube = () => {
  // State for cube configuration
  const [cubeSize, setCubeSize] = useState(3);
  // Theme state (optional)
  const [theme, setTheme] = useState({
    P: 0x000000, // Piece color
    L: 0xff0000, // Left face
    R: 0xff9900, // Right face
    D: 0xffffff, // Down face
    U: 0xffff00, // Up face
    B: 0x0000ff, // Back face
    F: 0x00ff00  // Front face
  });
  
  // Function to handle size change
  const handleSizeChange = (size) => {
    setCubeSize(Number(size));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="cube-viewport flex-grow" style={{ height: '600px' }}>
        <RubiksCube 
          size={cubeSize}
          theme={theme}
        />
      </div>
      
      <div className="controls-container mt-4 p-4 bg-gray-100 rounded-lg">
        <div className="size-control mb-2 flex items-center">
          <label htmlFor="cube-size" className="mr-2 font-medium">Cube Size: </label>
          <select 
            id="cube-size" 
            value={cubeSize} 
            onChange={(e) => handleSizeChange(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="2">2×2×2</option>
            <option value="3">3×3×3</option>
            <option value="4">4×4×4</option>
            <option value="5">5×5×5</option>
          </select>
        </div>
        
        <div className="instructions mt-4">
          <p className="text-sm text-gray-700">
            Drag the cube to rotate it. Use the buttons below for preset rotations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cube;