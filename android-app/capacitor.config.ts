import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.solviotec.hrms',
  appName: 'SaffoPeople',
  webDir: '../web-app/dist',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
    hostname: 'app.solviotec.local',
    cleartext: false,
    allowNavigation: ['test.solviotec.com'],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#f4f7f6',
      showSpinner: true,
      spinnerColor: '#1e3a5f',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#f4f7f6',
    },
  },
};

export default config;
