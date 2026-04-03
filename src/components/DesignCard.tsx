import React from 'react';

interface DesignCardProps {
  label: string;
  preview: string | null;
  description: string;
  locked: boolean;
  onToggleLock: () => void;
  onShuffle: () => void;
}

export function DesignCard({ label, preview, description, locked, onToggleLock, onShuffle }: DesignCardProps) {
  return (
    <div className={`design-card ${locked ? 'locked' : ''}`}>
      {preview && (
        <div 
          className="card-color-swatch" 
          style={{ backgroundColor: preview }}
        />
      )}
      <div className="card-text">
        <div className="card-label">{label}</div>
        <div className="card-description">{description}</div>
      </div>
      <div className="card-actions">
        <button 
          className={`icon-btn ${locked ? 'active' : ''}`}
          onClick={onToggleLock}
          title="Toggle Lock"
        >
          {locked ? '🔒' : '🔓'}
        </button>
        <button 
          className="icon-btn"
          onClick={onShuffle}
          disabled={locked}
          title="Shuffle"
        >
          🎲
        </button>
      </div>
    </div>
  );
}
