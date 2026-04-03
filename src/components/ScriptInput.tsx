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
        <InfoTooltip text={mode === 'build' ? "Paste the raw text you want to convert into a carousel. Our AI will automatically chunk it into perfectly sized slides." : "Describe any specific constraints (like 'Make it more professional' or 'Change tone to casual') to guide the AI restyle."} />
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
