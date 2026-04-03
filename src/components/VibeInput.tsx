import React from 'react';
import { InfoTooltip } from './InfoTooltip';

interface VibeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function VibeInput({ value, onChange, placeholder }: VibeInputProps) {
  return (
    <div className="input-group">
      <div className="input-header">
        <label>Design Vibe</label>
        <InfoTooltip text="Guide the AI on visual style. Example: 'Dark sleek colors with large typography.'" />
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="vibe-input"
      />
    </div>
  );
}
