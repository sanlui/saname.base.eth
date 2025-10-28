import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { sdk } from '@farcaster/miniapp-sdk';

(async () => {
  try {
    await sdk.actions.ready();
    console.log("Mini App ready, splash screen hidden!");
  } catch (err) {
    console.error("Failed to call sdk.actions.ready():", err);
  }

  const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();
