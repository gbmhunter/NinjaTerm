import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ReactGA from "react-ga4";

import { App } from './App';
import AppView from './AppView';
import HomepageView from './Homepage/HomepageView';

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
