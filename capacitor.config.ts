import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mahjrank.app',
  appName: 'MahjRank',
  webDir: 'dist',
  server: {
    // In production, the app loads from the local dist bundle.
    // Uncomment the line below during development to live-reload from your dev server:
    // url: 'http://YOUR_LOCAL_IP:5173',
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0F172A',
      showSpinner: false,
      launchFadeOutDuration: 300,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FFFFFF',
    },
  },
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scheme: 'MahjRank',
    scrollEnabled: false,
    allowsLinkPreview: false,
    backgroundColor: '#F0EDEB',
  },
};

export default config;
