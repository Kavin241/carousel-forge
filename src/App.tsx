import { useState, useEffect } from 'react';
import {
  Button,
  FormField,
  MultilineInput,
  Rows,
  SegmentedControl,
  Text,
  Title,
  Alert,
  LoadingIndicator,
  Columns,
  Column,
  Box,
} from '@canva/app-ui-kit';
import { useCanvasReader } from './hooks/useCanvasReader';
import { useGemini } from './hooks/useGemini';
import { useDesignState } from './hooks/useDesignState';
import { applyDesignToCanvas } from './lib/canvasWriter';

type AppMode = 'build' | 'restyle';

export function App() {
  const [mode, setMode] = useState<AppMode>('build');
  const [script, setScript] = useState('');
  const [vibePrompt, setVibePrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'building' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { extractedSlides, toggleSlide, refreshSlides } = useCanvasReader();
  const { designSpec, generateDesign, shuffleElements } = useGemini();
  const { lockState, toggleLock } = useDesignState();

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
    <div style={{ padding: 12 }}>
      <Rows spacing="2u">
        {/* Mode Selector */}
        <SegmentedControl
          options={[
            { label: 'Build', value: 'build' },
            { label: 'Restyle', value: 'restyle' },
          ]}
          value={mode}
          onChange={(value) => setMode(value as AppMode)}
        />

        {/* Script Content */}
        <FormField
          label={mode === 'build' ? 'Script content' : 'Restyle context'}
          description={
            mode === 'build'
              ? 'Paste raw text. AI auto-chunks it into slides.'
              : 'Add direction for the restyle.'
          }
        >
          <MultilineInput
            value={script}
            onChange={(value) => setScript(value)}
            placeholder={
              mode === 'build'
                ? 'Paste your script, topic, or leave blank...'
                : 'Optional: paste context or direction...'
            }
            minRows={3}
            maxRows={6}
          />
        </FormField>

        {/* Design Vibe */}
        <FormField
          label="Design vibe"
          description="Guide the visual style. e.g. 'Dark and editorial'."
        >
          <MultilineInput
            value={vibePrompt}
            onChange={(value) => setVibePrompt(value)}
            placeholder='e.g. "warm scrapbook", "clean notes app", "bold neon"...'
            minRows={2}
            maxRows={4}
          />
        </FormField>

        {/* Generate Button */}
        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={status === 'loading' || status === 'building'}
          stretch
        >
          {status === 'loading' ? 'Generating...' : 'Generate Design'}
        </Button>

        {/* Loading State */}
        {status === 'loading' && (
          <Rows spacing="1u">
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <LoadingIndicator size="medium" />
            </div>
            <Text size="small" alignment="center" tone="tertiary">
              AI is crafting your carousel...
            </Text>
          </Rows>
        )}

        {/* Design Ready */}
        {designSpec && status === 'ready' && (
          <Rows spacing="1.5u">
            <Alert tone="positive">
              Design generated! Review and apply it to your canvas.
            </Alert>
            <Button
              variant="primary"
              onClick={handleBuild}
              stretch
            >
              Apply to Canvas
            </Button>
          </Rows>
        )}

        {/* Building State */}
        {status === 'building' && (
          <Rows spacing="1u">
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <LoadingIndicator size="medium" />
            </div>
            <Text size="small" alignment="center" tone="tertiary">
              Applying design to canvas...
            </Text>
          </Rows>
        )}

        {/* Done */}
        {status === 'done' && (
          <Alert tone="positive">
            Carousel applied successfully!
          </Alert>
        )}

        {/* Error */}
        {status === 'error' && errorMessage && (
          <Alert tone="critical">
            {errorMessage}
          </Alert>
        )}
      </Rows>
    </div>
  );
}
