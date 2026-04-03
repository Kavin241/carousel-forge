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
        <InfoTooltip text="Instruct the AI exactly how you want the design to look and feel. E.g. 'Use dark sleek colors', 'Make it look like a scrapbook', 'Use giant typography'." />
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
