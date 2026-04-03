import React from 'react';

interface BuildButtonProps {
  onClick: () => void;
}

export function BuildButton({ onClick }: BuildButtonProps) {
  return (
    <button className="build-btn" onClick={onClick}>
      Build to Canvas
    </button>
  );
}
