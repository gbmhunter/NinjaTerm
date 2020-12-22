import React from 'react';
import { render } from 'react-dom';
import App from './App';
import './App.global.css';

import { Provider } from 'react-redux'
import configureStore from './store'

render(
  <App />,
document.getElementById('root'));
