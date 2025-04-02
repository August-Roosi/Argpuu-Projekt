import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

import './styles/actions.css';
import './styles/index.css';
const argumentMapId = window.argumentMapId; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  
  <React.StrictMode>
    <App argumentMapId={argumentMapId}/>
  </React.StrictMode>
);
