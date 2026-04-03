import React from 'react';

interface VibeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function VibeInput({ value, onChange, placeholder }: VibeInputProps) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="vibe-input"
    />
  );
}
