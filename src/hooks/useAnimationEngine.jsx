import { useEffect } from 'react';
import animationEngine from '../engine/animationEngine';

export const useAnimationEngine = (animationInstance) => {
  useEffect(() => {
    if (animationInstance) {
      animationEngine.add(animationInstance);

      return () => {
        animationEngine.remove(animationInstance);
      };
    }
  }, [animationInstance]);
};
