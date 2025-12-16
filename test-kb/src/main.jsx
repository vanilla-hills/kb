import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'

function renderApp() {
  try {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    )
  } catch (err) {
    showFatalError(err)
  }
}

function showFatalError(err) {
  const root = document.getElementById('root')
  if (!root) return
  root.innerHTML = ''
  const pre = document.createElement('pre')
  pre.style.whiteSpace = 'pre-wrap'
  pre.style.padding = '1rem'
  pre.style.background = '#111'
  pre.style.color = '#fff'
  pre.style.fontSize = '13px'
  pre.textContent = String(err && (err.stack || err.message || err))
  root.appendChild(pre)
}

window.addEventListener('error', (e) => {
  showFatalError(e.error || e.message || 'Unknown error')
})
window.addEventListener('unhandledrejection', (e) => {
  showFatalError(e.reason || 'Unhandled rejection')
})

renderApp()
