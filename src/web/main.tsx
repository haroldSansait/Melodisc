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

class WebErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('WebErrorBoundary caught crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#1a0505',
          color: '#ff8888',
          padding: '24px',
          fontFamily: 'monospace',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: '0 0 12px 0' }}>Melodisc Web Crash</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error?.stack || this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

console.log('Melodisc main.tsx initialized, rootTag found:', !!rootTag);
createRoot(rootTag).render(
  <WebErrorBoundary>
    <App />
  </WebErrorBoundary>
);
