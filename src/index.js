// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

window.history.scrollRestoration = 'manual';

const element = document.getElementById('root');

if (element) {
  ReactDOM.render(<App />, element);
}
