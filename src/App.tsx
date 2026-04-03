import { useState, useEffect } from 'react';
import { useCanvasReader } from './hooks/useCanvasReader';
import { useGemini } from './hooks/useGemini';
import { useDesignState } from './hooks/useDesignState';
import { ModeToggle } from './components/ModeToggle';
import { ScriptInput } from './components/ScriptInput';
import { VibeInput } from './components/VibeInput';
import { DesignPanel } from './components/DesignPanel';
import { SlidePreview } from './components/SlidePreview';
import { BuildButton } from './components/BuildButton';
import { StatusBar } from './components/StatusBar';
import { applyDesignToCanvas } from './lib/canvasWriter';

export function App() {
  const [mode, setMode] = useState<'restyle' | 'build'>('build');
  const [script, setScript] = useState('');
  const [vibePrompt, setVibePrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'building' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { extractedSlides, toggleSlide, refreshSlides } = useCanvasReader();
  const { designSpec, generateDesign, shuffleElements } = useGemini();
  const { lockState, toggleLock } = useDesignState();

  // Auto-detect mode on mount
  useEffect(() => {
    refreshSlides().then(slides => {
      if (slides && slides.some(s => s.textBlocks.length > 0)) {
        setMode('restyle');
      }
    });
  }, [refreshSlides]);

  const handleGenerate = async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      await generateDesign({
        mode,
        script: script || null,
        vibePrompt: vibePrompt || null,
        existingSlides: mode === 'restyle' ? extractedSlides : null,
        lockedElements: lockState,
        shuffleTarget: 'all'
      });
      setStatus('ready');
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message);
    }
  };

  const handleShuffle = async (target: keyof typeof lockState | 'all') => {
    setStatus('loading');
    try {
      await shuffleElements(target, {
        mode,
        script: script || null,
        vibePrompt: vibePrompt || null,
        existingSlides: mode === 'restyle' ? extractedSlides : null,
        lockedElements: lockState
      });
      setStatus('ready');
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message);
    }
  };

  const handleBuild = async () => {
    if (!designSpec) return;
    setStatus('building');
    try {
      await applyDesignToCanvas(designSpec, mode, extractedSlides?.length ?? 0);
      setStatus('done');
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message);
    }
  };

  return (
    <div className="panel">
      <header className="panel-header">
        <ModeToggle mode={mode} onChange={setMode} />
      </header>

      {mode === 'restyle' && extractedSlides && (
        <SlidePreview slides={extractedSlides} onToggle={toggleSlide} />
      )}

      <ScriptInput
        value={script}
        onChange={setScript}
        mode={mode}
        placeholder={mode === 'build'
          ? 'Paste your script, a paragraph topic, or leave blank to generate fresh content...'
          : 'Optional: paste any additional context or direction for this restyle...'
        }
      />

      <VibeInput
        value={vibePrompt}
        onChange={setVibePrompt}
        placeholder='Optional: describe a vibe (e.g. "dark and editorial", "warm and scrapbook", "clean notes app feel")...'
      />

      <button
        className="generate-btn"
        onClick={handleGenerate}
        disabled={status === 'loading' || status === 'building'}
      >
        {status === 'loading' ? 'Generating...' : 'Generate Design'}
      </button>

      {designSpec && status !== 'loading' && (
        <DesignPanel
          spec={designSpec}
          lockState={lockState}
          onToggleLock={toggleLock}
          onShuffle={handleShuffle}
        />
      )}

      {designSpec && status === 'ready' && (
        <BuildButton onClick={handleBuild} />
      )}

      <StatusBar status={status} error={errorMessage} />
    </div>
  );
}
