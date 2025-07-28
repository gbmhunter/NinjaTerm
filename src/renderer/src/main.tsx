import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ReactGA from "react-ga4";

import AppView from './view/AppView';

// Initialize Electron adapters if running in Electron
import { initializeElectronSerialAdapter } from './services/ElectronSerialAdapter';
import { initializeElectronFileSystemAdapter } from './services/ElectronFileSystemAdapter';

// Initialize adapters before the app starts
initializeElectronSerialAdapter();
initializeElectronFileSystemAdapter();

// Google Analytics. Only initialize in production, otherwise things like
// Playwright tests can spam GA and skew data
if (import.meta.env.PROD) {
  ReactGA.initialize("G-SDMMGN71FN");
} else {
  console.log('Detected dev. environment, not initializing Google Analytics.');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Create routes for Electron app. Load directly into the terminal application.
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppView />,
  },
]);

root.render(
  // WARNING: StrictMode causes double renders, which causes problems
  // during development when trying to open previously used serial ports
  // and also with loading other things from local storage
  // <React.StrictMode>
    <RouterProvider router={router} />
  // </React.StrictMode>
);
