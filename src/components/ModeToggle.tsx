import React from 'react';
import { AppMode } from '../lib/types';

interface ModeToggleProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="mode-toggle">
      <button 
        className={mode === 'build' ? 'active' : ''} 
        onClick={() => onChange('build')}
      >
        Build
      </button>
      <button 
        className={mode === 'restyle' ? 'active' : ''} 
        onClick={() => onChange('restyle')}
      >
        Restyle
      </button>
    </div>
  );
}
