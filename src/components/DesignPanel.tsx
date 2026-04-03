import React from 'react';
import { DesignCard } from './DesignCard';
import { DesignSpec, LockState } from '../lib/types';

const CARDS = [
  {
    key: 'background' as keyof LockState,
    label: 'Background',
    getPreview: (spec: DesignSpec) => spec.palette.background,
    getDescription: (spec: DesignSpec) => `${spec.backgroundStyle} · ${spec.palette.background}`
  },
  {
    key: 'typography' as keyof LockState,
    label: 'Typography',
    getPreview: (spec: DesignSpec) => null,
    getDescription: (spec: DesignSpec) =>
      `${spec.typography.heading.fontFamily} / ${spec.typography.body.fontFamily}`
  },
  {
    key: 'accentColor' as keyof LockState,
    label: 'Accent Colour',
    getPreview: (spec: DesignSpec) => spec.palette.accent,
    getDescription: (spec: DesignSpec) => spec.palette.accent
  },
  {
    key: 'layout' as keyof LockState,
    label: 'Layout Style',
    getPreview: (spec: DesignSpec) => null,
    getDescription: (spec: DesignSpec) => spec.layoutStyle.replace('_', ' ')
  },
  {
    key: 'graphicElements' as keyof LockState,
    label: 'Graphic Elements',
    getPreview: (spec: DesignSpec) => null,
    getDescription: (spec: DesignSpec) =>
      spec.graphicElements.map(e => e.type.replace('_', ' ')).join(', ')
  },
  {
    key: 'contentAngle' as keyof LockState,
    label: 'Content Angle',
    getPreview: (spec: DesignSpec) => null,
    getDescription: (spec: DesignSpec) => spec.contentAngle
  }
];

interface DesignPanelProps {
  spec: DesignSpec;
  lockState: LockState;
  onToggleLock: (key: keyof LockState) => void;
  onShuffle: (key: keyof LockState | 'all') => void;
}

export function DesignPanel({ spec, lockState, onToggleLock, onShuffle }: DesignPanelProps) {
  return (
    <div className="design-panel">
      <div className="panel-meta">
        <span className="vibe-name">{spec.vibeName}</span>
        <span className="trend-note">{spec.trendNote}</span>
      </div>

      <div className="cards-list">
        {CARDS.map(card => (
          <DesignCard
            key={card.key}
            label={card.label}
            preview={card.getPreview(spec)}
            description={card.getDescription(spec)}
            locked={lockState[card.key]}
            onToggleLock={() => onToggleLock(card.key)}
            onShuffle={() => onShuffle(card.key)}
          />
        ))}
      </div>

      <div className="shuffle-controls">
        <button className="shuffle-all-btn" onClick={() => onShuffle('all')}>
          Shuffle All Unlocked
        </button>
      </div>
    </div>
  );
}
