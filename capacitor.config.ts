import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cz.dechbar.app',
  appName: 'DechBar',
  webDir: 'dist',
  
  // ===== SERVER CONFIGURATION =====
  server: {
    // iOS/Android will use HTTPS scheme (secure)
    androidScheme: 'https',
    iosScheme: 'https',
    
    // Hostname matching production domain
    // This allows deep links like: https://dechbar.cz/app
    hostname: 'dechbar.cz',
    
    // Clear text traffic (allow localhost for dev)
    // iOS simulator uses http://localhost
    cleartext: true,
  },
  
  // ===== PLUGINS =====
  plugins: {
    // Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#121212',  // Dark background (Brand Book)
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#F8CA00',  // DechBar gold
      splashFullScreen: true,
      splashImmersive: true,
    },
    
    // Status Bar (iOS/Android)
    StatusBar: {
      style: 'DARK',  // Dark icons (for light background)
      backgroundColor: '#121212',  // Dark bar background
    },
  },
};

export default config;
