import { createRoot } from 'react-dom/client';
// import { autoDetect } from '@serialport/bindings-cpp';
import { SerialPort } from 'serialport';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { App } from 'model/App';
import AppView from './AppView';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
// Create serial interface bindings appropriate for system we
// are running on
// const Bindings = autoDetect();
console.log(SerialPort);
const app = new App(SerialPort);
root.render(<AppView app={app} />);

// calling IPC exposed from preload script
// window.electron.ipcRenderer.once('ipc-example', (arg) => {
//   // eslint-disable-next-line no-console
//   console.log(arg);
// });
// window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
