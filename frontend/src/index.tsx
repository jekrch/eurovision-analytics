import React from 'react';
import Home from './components/Home';
import { VideoPipProvider } from './components/video/VideoPipContext';
import { createRoot } from 'react-dom/client';
import './index.css';
import './theme.css';

const container = document.getElementById('root');
const root = createRoot(container as any); // createRoot(container!) if you use TypeScript
root.render(
  <VideoPipProvider>
    <Home />
  </VideoPipProvider>
);