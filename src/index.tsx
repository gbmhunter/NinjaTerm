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

// Add Umami analytics script only in production.
// Insert script into head of HTML document
if (import.meta.env.PROD) {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://umami.mbedded.ninja/script.js';
  script.setAttribute('data-website-id', 'b0ab1a49-5d70-4e53-b2e2-6f3b8127ef84');
  document.getElementsByTagName('head')[0].appendChild(script);
} else {
  console.log('Detected dev. environment, not adding Umami script.');
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
