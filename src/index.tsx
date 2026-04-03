import React from 'react';
import { AppUiProvider } from '@canva/app-ui-kit';
import { createRoot } from 'react-dom/client';
import './styles/panel.css';
import '@canva/app-ui-kit/styles.css';
import { prepareDesignEditor } from "@canva/intents/design";

prepareDesignEditor({
  render: async () => {
    // Dynamically load the App to ensure window.canva_sdk is fully injected by Canva first!
    const { App } = await import('./App');
    createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <AppUiProvider>
          <App />
        </AppUiProvider>
      </React.StrictMode>
    );
  }
});
