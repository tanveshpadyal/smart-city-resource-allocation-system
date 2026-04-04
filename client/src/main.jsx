import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { SocketProvider } from './context/SocketProvider.jsx'
import NotificationCenter from './components/common/NotificationCenter.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SocketProvider>
        <NotificationCenter />
        <App />
      </SocketProvider>
    </ThemeProvider>
  </StrictMode>,
)
