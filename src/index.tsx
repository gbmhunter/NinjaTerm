import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ReactGA from "react-ga4";
import { registerSW } from 'virtual:pwa-register';
import { closeSnackbar }  from 'notistack';

import { App } from './App';
import AppView from './AppView';
import HomepageView from './Homepage/HomepageView';
import { Button } from '@mui/material';

// Google Analytics
ReactGA.initialize("G-SDMMGN71FN");

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const app = new App();

declare global {
  interface Window { app: App; }
}

window.app = app;

// This would be better suited to be done inside the App class, but the Vite PWA
// docs at https://vite-pwa-org.netlify.app/guide/prompt-for-update say
// to put it in your "main.ts or main.js file:".
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('onNeedRefresh() called.');
    app.snackbar.sendToSnackbar(
      'A new version of NinjaTerm is available. Click Reload to update.',
      'info',
      (snackbarId) => <>
        <Button onClick={() => {
          updateSW(true);
        }}>
          Reload
        </Button>
        <Button
          onClick={() => {
            closeSnackbar(snackbarId);
          }}
        >Close</Button>
      </>,
      true, // Make this snackbar persist until the user clicks either of the buttons
    );
  },
  onOfflineReady() {
    console.log('onOfflineReady() called.');
    app.snackbar.sendToSnackbar('NinjaTerm is offline ready.', 'info');
  },
  onRegisterError(error) {
    console.log('onRegisterError() called.');
    console.error(error.message);
  }
})

// Create routes. Only 2 routes. The root is the
// landing page which is static, and then
// at /app is the main NinjaTerm application
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomepageView />,
  },
  {
    path: "/app",
    element: <AppView app={app} />,
  },
]);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
// serviceWorkerRegistration.unregister();
// serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
