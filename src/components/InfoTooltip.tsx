import React from 'react';
import '../styles/tooltip.css';

interface InfoTooltipProps {
  text: string;
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <div className="info-tooltip-container">
      <span className="info-icon">i</span>
      <div className="info-tooltip-text">{text}</div>
    </div>
  );
}
