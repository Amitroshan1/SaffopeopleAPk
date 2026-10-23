
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installMobileApiShim } from './mobile/mobileApiShim.js'
import { installNativeEnhancements } from './mobile/native/nativeBootstrap.js'
import { LocationServicesGate } from './mobile/native/LocationServicesGate.jsx'
import "./index.css"
import "./mobile/mobile-ui.css"
import { App } from './App.jsx'

installMobileApiShim()

installNativeEnhancements().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <LocationServicesGate>
        <App />
      </LocationServicesGate>
    </StrictMode>
  )

  import('@capacitor/splash-screen')
    .then(({ SplashScreen }) => SplashScreen.hide())
    .catch(() => {})
})
