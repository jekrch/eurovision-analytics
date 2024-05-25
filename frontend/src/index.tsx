import React from 'react';
import Home from './components/Home';
import { createRoot } from 'react-dom/client';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container as any); // createRoot(container!) if you use TypeScript
root.render(<Home />);