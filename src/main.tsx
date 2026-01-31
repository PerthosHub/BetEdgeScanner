import React from 'react'
import ReactDOM from 'react-dom/client'
// AANGEPAST: Verwijs naar de nieuwe locatie in de popup map
import App from './popup/App.tsx' 
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)