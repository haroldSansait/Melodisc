import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppRegistry } from 'react-native';

import App from '../../App';
import appConfig from '../../app.json';

const appName = appConfig.expo.name;

AppRegistry.registerComponent(appName, () => App);

const rootTag = document.getElementById('root');

if (!rootTag) {
  throw new Error('Missing root element.');
}

createRoot(rootTag).render(<App />);
