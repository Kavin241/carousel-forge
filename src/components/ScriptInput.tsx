import React from 'react';
import { AppMode } from '../lib/types';
import { InfoTooltip } from './InfoTooltip';

interface ScriptInputProps {
  value: string;
  onChange: (value: string) => void;
  mode: AppMode;
  placeholder: string;
}

export function ScriptInput({ value, onChange, mode, placeholder }: ScriptInputProps) {
  return (
    <div className="input-group">
      <div className="input-header">
        <label>{mode === 'build' ? 'Script Content' : 'Restyle Context'}</label>
        <InfoTooltip text={mode === 'build' ? "Paste raw text or notes. The AI auto-chunks it into carousel pages. Example: Paste a long LinkedIn post." : "Add rules for how to redesign the existing slides. Example: 'Use a more professional tone'."} />
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="script-input"
      />
    </div>
  );
}
