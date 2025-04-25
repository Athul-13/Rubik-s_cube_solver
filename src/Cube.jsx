import React, { useState, useEffect } from 'react';
import RubiksCube from './RubiksCube';

const Cube = () => {
  // State for cube configuration
  const [cubeSize, setCubeSize] = useState(3);
  // Function to handle size change
  const handleSizeChange = (size) => {
    setCubeSize(Number(size));
  };


  return (
    <div className="cube-app-container">
      <div className="cube-viewport" style={{ width: '100%', height: '600px' }}>
        <RubiksCube 
          size={cubeSize} 
        />
      </div>
      
      <div className="controls-container mt-4">
        <div className="size-control mb-2">
          <label htmlFor="cube-size">Cube Size: </label>
          <select 
            id="cube-size" 
            value={cubeSize} 
            onChange={(e) => handleSizeChange(e.target.value)}
          >
            <option value="2">2×2×2</option>
            <option value="3">3×3×3</option>
            <option value="4">4×4×4</option>
            <option value="5">5×5×5</option>
          </select>
        </div>
        
      </div>
    </div>
  );
};

export default Cube;