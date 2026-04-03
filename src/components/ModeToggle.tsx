import React from 'react';
import { AppMode } from '../lib/types';
import { InfoTooltip } from './InfoTooltip';

interface ModeToggleProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
      <InfoTooltip text="Build mode generates an entirely new set of carousel slides from scratch based on your script. Restyle mode reads the existing slides on your canvas and redesigns them without changing your text." />
    </div>
  );
}
