import React from 'react';
import { AppUiProvider } from '@canva/app-ui-kit';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/panel.css';
import '@canva/app-ui-kit/styles.css';
import { prepareDesignEditor } from "@canva/intents/design";

prepareDesignEditor({
  render: async () => {
    createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <AppUiProvider>
          <App />
        </AppUiProvider>
      </React.StrictMode>
    );
  }
});
