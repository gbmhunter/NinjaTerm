import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import AppView from './view/AppView';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Electron app: render AppView directly without router
root.render(
  // WARNING: StrictMode causes double renders, which causes problems
  // during development when trying to open previously used serial ports
  // and also with loading other things from local storage
  // <React.StrictMode>
    <AppView />
  // </React.StrictMode>
);
