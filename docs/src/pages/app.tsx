import React from 'react';
import { Redirect } from '@docusaurus/router';

export default function App(): JSX.Element {
  // This will immediately redirect to the web app
  return <Redirect to="https://ninjaterm-app.netlify.app/app" />;
}