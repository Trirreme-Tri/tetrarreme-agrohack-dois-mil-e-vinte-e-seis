import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/fonts.css'
import './styles/industry.css'
import './styles/tokens.css'
import './styles/app.css'
import { App } from './app/App.tsx'
import { criarBanco } from './dados/banco.ts'

// PWA: o service worker guarda o app e as fontes; depois da primeira visita, abre sem internet.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App db={criarBanco()} />
  </StrictMode>,
)
