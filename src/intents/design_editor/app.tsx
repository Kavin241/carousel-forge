import React, { useState } from "react";
import {
  Button,
  Rows,
  Text,
  MultilineInput,
  Title,
  Alert,
  LoadingIndicator,
  Columns,
  Column,
  Badge,
} from "@canva/app-ui-kit";
import { callGemini, parseDesignPayload } from "../../lib/gemini";
import { buildDesignPrompt } from "../../lib/promptBuilder";
import { applyDesignToCanvas } from "../../lib/canvasWriter";
import type { DesignSystemPayload } from "../../lib/types";
import { MASTER_TEMPLATES } from "../../lib/templates";
import * as styles from "./app.css";

type Status = "idle" | "generating" | "applying" | "done" | "error";

export function App() {
  const [script, setScript] = useState("");
  const [vibePrompt, setVibePrompt] = useState("");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [payload, setPayload] = useState<DesignSystemPayload | null>(null);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [typographyIndex, setTypographyIndex] = useState(0);

  const handleGenerate = async () => {
    setStatus("generating");
    setErrorMessage("");
    try {
      const prompt = buildDesignPrompt({
        script: script || null,
        vibePrompt: selectedTemplateKey ? null : vibePrompt || null,
        baseTemplate: selectedTemplateKey ? MASTER_TEMPLATES[selectedTemplateKey] : null,
      });

      const rawResult = await callGemini(prompt);
      const parsedPayload = await parseDesignPayload(rawResult);
      setPayload(parsedPayload);
      setPaletteIndex(0);
      setTypographyIndex(0);
      setStatus("done");
    } catch (e: any) {
      setStatus("error");
      setErrorMessage(e.message || "Unknown error during generation");
    }
  };

  const currentDesign = React.useMemo(() => {
    if (!payload) return null;
    return {
      ...payload.activeDesign,
      palette:
        payload.shuffleBanks.palettes[paletteIndex] || payload.activeDesign.palette,
      typography:
        payload.shuffleBanks.typographies[typographyIndex] ||
        payload.activeDesign.typography,
    };
  }, [payload, paletteIndex, typographyIndex]);

  const handleApplyToCanvas = async () => {
    if (!currentDesign) return;
    setStatus("applying");
    setErrorMessage("");
    try {
      await applyDesignToCanvas(currentDesign);
      setStatus("done");
    } catch (e: any) {
      setStatus("error");
      setErrorMessage(e.message || "Failed to apply design to canvas");
    }
  };

  const isLoading = status === "generating" || status === "applying";
  const templateKeys = Object.keys(MASTER_TEMPLATES);

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        {/* Header */}
        <Rows spacing="0.5u">
          <Title size="medium">CarouselForge</Title>
          <Text size="small" tone="tertiary">
            AI-powered carousel generator
          </Text>
        </Rows>

        {/* Phase 1: Setup UI (Hidden when viewing design) */}
        {!payload && (
          <Rows spacing="2u">
            <Rows spacing="1u">
              <Text size="small" tone="secondary">
                1. Content Script
              </Text>
              <MultilineInput
                value={script}
                onChange={setScript}
                placeholder="Paste your content outline (e.g. '5 ways to save on taxes as an expat')..."
                disabled={isLoading}
                autoGrow
                minRows={3}
                maxRows={8}
              />
            </Rows>

            <Rows spacing="1u">
              <Text size="small" tone="secondary">
                2. Design Template
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Button
                  variant={selectedTemplateKey === null ? "primary" : "secondary"}
                  onClick={() => setSelectedTemplateKey(null)}
                  disabled={isLoading}
                  stretch
                >
                  ✨ AI Custom Logic
                </Button>
                {templateKeys.map((key) => (
                  <Button
                    key={key}
                    variant={selectedTemplateKey === key ? "primary" : "secondary"}
                    onClick={() => setSelectedTemplateKey(key)}
                    disabled={isLoading}
                    stretch
                  >
                    {"Preset: " + MASTER_TEMPLATES[key].vibeName}
                  </Button>
                ))}
              </div>
            </Rows>

            {selectedTemplateKey === null && (
              <Rows spacing="1u">
                <Text size="small" tone="secondary">
                  Custom Vibe
                </Text>
                <MultilineInput
                  value={vibePrompt}
                  onChange={setVibePrompt}
                  placeholder='e.g. "dark and professional", "clean notes app", "neon maximalist"'
                  disabled={isLoading}
                  autoGrow
                  minRows={2}
                  maxRows={4}
                />
              </Rows>
            )}

            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={isLoading}
              stretch
            >
              {status === "generating" ? "Generating Payload..." : "Generate Concept"}
            </Button>
          </Rows>
        )}

        {/* Loading State */}
        {isLoading && (
          <Rows spacing="1u" align="center">
            <LoadingIndicator size="medium" />
            <Text size="small" tone="tertiary" alignment="center">
              {status === "generating"
                ? "AI is building your design system..."
                : "Applying design to canvas..."}
            </Text>
          </Rows>
        )}

        {/* Error State */}
        {status === "error" && errorMessage && (
          <Alert tone="critical">
            {errorMessage.length > 200
              ? errorMessage.substring(0, 200) + "..."
              : errorMessage}
          </Alert>
        )}

        {/* Phase 2: Design Tuner UI (When payload exists) */}
        {payload && currentDesign && !isLoading && (
          <Rows spacing="1.5u">
            <Rows spacing="0.5u">
              <Columns spacing="1u" alignY="center">
                <Column>
                  <Text size="small" tone="secondary">
                    Design Tuner
                  </Text>
                </Column>
                <Column width="content">
                  <Badge tone="assist" text={currentDesign.vibeName} />
                </Column>
              </Columns>
              <Text size="xsmall" tone="tertiary">
                {currentDesign.trendNote}
              </Text>
            </Rows>

            {/* Shuffle Buttons */}
            <Rows spacing="0.5u">
              <Columns spacing="1u">
                <Column>
                  <Button
                    variant="secondary"
                    stretch
                    onClick={() =>
                      setPaletteIndex(
                        (i) => (i + 1) % Math.max(1, payload.shuffleBanks.palettes.length)
                      )
                    }
                    disabled={payload.shuffleBanks.palettes.length === 0}
                  >
                    🎲 Colors
                  </Button>
                </Column>
                <Column>
                  <Button
                    variant="secondary"
                    stretch
                    onClick={() =>
                      setTypographyIndex(
                        (i) =>
                          (i + 1) %
                          Math.max(1, payload.shuffleBanks.typographies.length)
                      )
                    }
                    disabled={payload.shuffleBanks.typographies.length === 0}
                  >
                    🎲 Fonts
                  </Button>
                </Column>
              </Columns>
            </Rows>

            {/* Color Palette Preview */}
            <Rows spacing="0.5u">
              <Text size="xsmall" tone="secondary">
                Active Palette {paletteIndex > 0 ? `(${paletteIndex + 1})` : ""}
              </Text>
              <div className={styles.paletteRow}>
                <div
                  className={styles.colorSwatch}
                  style={{ backgroundColor: currentDesign.palette.background }}
                  title={`Background: ${currentDesign.palette.background}`}
                />
                <div
                  className={styles.colorSwatch}
                  style={{ backgroundColor: currentDesign.palette.primary }}
                  title={`Primary: ${currentDesign.palette.primary}`}
                />
                <div
                  className={styles.colorSwatch}
                  style={{ backgroundColor: currentDesign.palette.accent }}
                  title={`Accent: ${currentDesign.palette.accent}`}
                />
                <div
                  className={styles.colorSwatch}
                  style={{ backgroundColor: currentDesign.palette.secondary }}
                  title={`Secondary: ${currentDesign.palette.secondary}`}
                />
              </div>
            </Rows>

            {/* Typography Preview */}
            <Rows spacing="0.5u">
              <Text size="xsmall" tone="secondary">
                Active Typography {typographyIndex > 0 ? `(${typographyIndex + 1})` : ""}
              </Text>
              <Text size="small">
                {currentDesign.typography.heading.fontFamily} /{" "}
                {currentDesign.typography.body.fontFamily}
              </Text>
            </Rows>

            {/* Slides Preview */}
            <Rows spacing="0.5u">
              <Text size="xsmall" tone="secondary">
                Generated Slides ({currentDesign.slides.length})
              </Text>
              {currentDesign.slides.map((slide, i) => (
                <div key={i} className={styles.slideItem}>
                  <Text size="xsmall" tone="tertiary">
                    {i + 1}. [{slide.type}]
                  </Text>
                  <Text size="small">
                    {slide.heading.length > 50
                      ? slide.heading.substring(0, 50) + "..."
                      : slide.heading}
                  </Text>
                </div>
              ))}
            </Rows>

            {/* Apply & Start Over */}
            <Rows spacing="1u">
              <Button
                variant="primary"
                onClick={handleApplyToCanvas}
                disabled={isLoading}
                stretch
              >
                Apply to Canvas
              </Button>
              <Columns spacing="1u">
                <Column>
                  <Button
                    variant="secondary"
                    onClick={handleGenerate}
                    disabled={isLoading}
                    stretch
                  >
                    Regenerate All
                  </Button>
                </Column>
                <Column>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setPayload(null);
                      setStatus("idle");
                    }}
                    disabled={isLoading}
                    stretch
                  >
                    Start Over
                  </Button>
                </Column>
              </Columns>
            </Rows>
          </Rows>
        )}

        {/* Success State */}
        {status === "done" && payload && (
          <Alert tone="positive">Design applied! Check your canvas.</Alert>
        )}
      </Rows>
    </div>
  );
}
