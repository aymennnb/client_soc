import { StrictMode } from 'react'
import { createRoot }  from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { KeycloakProvider } from './context/KeycloakContext'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
    //<StrictMode>
        <BrowserRouter>
            <KeycloakProvider>
                <App />
            </KeycloakProvider>
        </BrowserRouter>
    //</StrictMode>
)