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
      <InfoTooltip text="Build: Generates brand new slides from text. Restyle: Redesigns current canvas slides without losing your text." />
    </div>
  );
}
