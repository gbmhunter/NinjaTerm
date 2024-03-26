import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ReactGA from "react-ga4";

import AppView from './view/AppView';
import HomepageView from './Homepage/HomepageView';

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

// Enable Umami analytics script in production and disable
// in dev. environment. Use the umami.disabled key in local storage for doing so
if (import.meta.env.PROD) {
  // It's not good enough just to set the key to 0, it needs to be removed
  window.localStorage.removeItem('umami.disabled');
} else {
  console.log('Detected dev. environment, setting umami.disabled in local storage to "1".');
  window.localStorage.setItem('umami.disabled', '1');
}

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
