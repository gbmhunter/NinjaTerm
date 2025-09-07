import React, { useEffect } from 'react';
import Layout from '@theme/Layout';

export default function App(): JSX.Element {
  useEffect(() => {
    // Redirect to the web app immediately
    window.location.href = 'https://ninjaterm-app.mbedded.ninja/';
  }, []);

  return (
    <Layout title="Redirecting to NinjaTerm Web App...">
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        flexDirection: 'column'
      }}>
        <h2>Redirecting to NinjaTerm Web App...</h2>
        <p>If you are not redirected automatically, <a href="https://ninjaterm-app.mbedded.ninja/">click here</a>.</p>
      </div>
    </Layout>
  );
}
