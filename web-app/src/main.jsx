import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installMobileApiShim } from './mobile/mobileApiShim.js'
import { installNativeEnhancements } from './mobile/native/nativeBootstrap.js'
import "./index.css"
import "./mobile/mobile-ui.css"
import {App} from './App.jsx'

installMobileApiShim()
installNativeEnhancements()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
