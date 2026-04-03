import React from 'react';

interface StatusBarProps {
  status: 'idle' | 'loading' | 'ready' | 'building' | 'done' | 'error';
  error: string;
}

export function StatusBar({ status, error }: StatusBarProps) {
  if (status === 'idle') return null;
  
  if (status === 'error') {
    return <div className="status-bar error">{error}</div>;
  }
  
  const messages: Record<string, string> = {
    loading: 'Generating design system...',
    ready: 'Design ready. Shuffle elements or build.',
    building: 'Applying to Canvas...',
    done: 'Design applied successfully!'
  };

  return (
    <div className={`status-bar ${status}`}>
      {messages[status]}
    </div>
  );
}
