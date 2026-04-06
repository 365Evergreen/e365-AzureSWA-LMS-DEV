import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import type { IPublicClientApplication } from '@azure/msal-browser';
import './index.css';
import App from './App.tsx';
import { msalInstance } from './auth/msalConfig';
import { registerDefaultBlocks } from './blocks/registerDefaultBlocks';

registerDefaultBlocks();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance as unknown as IPublicClientApplication}>
      <App />
    </MsalProvider>
  </StrictMode>,
);
