import { useState } from 'react';
import { LockState } from '../lib/types';

export function useDesignState() {
  const [lockState, setLockState] = useState<LockState>({
    background: false,
    typography: false,
    accentColor: false,
    layout: false,
    graphicElements: false,
    contentAngle: false,
  });

  const toggleLock = (key: keyof LockState) => {
    setLockState(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return { lockState, toggleLock };
}
