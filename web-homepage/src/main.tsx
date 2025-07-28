import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ReactGA from "react-ga4";

import HomepageView from './Homepage/HomepageView';
import ManualView from './Manual/ManualView';

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

// Create routes for the marketing website
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomepageView />,
  },
  {
    path: "/manual",
    element: <ManualView />,
  },
]);

root.render(
  <RouterProvider router={router} />
);