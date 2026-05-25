import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'

// Some libraries (sockjs-client/etc.) expect a `global` variable in the browser environment.
// Ensure `global` is defined and points to `globalThis` to avoid runtime ReferenceError.
if (typeof window !== 'undefined' && typeof global === 'undefined') {
  // eslint-disable-next-line no-undef
  window.global = window
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
