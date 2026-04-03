import React from 'react';
import { AppMode } from '../lib/types';

interface ScriptInputProps {
  value: string;
  onChange: (value: string) => void;
  mode: AppMode;
  placeholder: string;
}

export function ScriptInput({ value, onChange, mode, placeholder }: ScriptInputProps) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="script-input"
    />
  );
}
