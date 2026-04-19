import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.socialleveling.app',
  appName: 'Social Leveling',
  webDir: 'dist',
  // Bundled mode: no server.url. App loads from local dist bundle.
  // This is the App Store compliant path (Apple rejects pure webview wrappers).
  ios: {
    contentInset: 'always',
    backgroundColor: '#0A0A0A',
    // Prevents WKWebView scroll bounce at top/bottom (feels more native)
    scrollEnabled: true,
  },
  // Placeholder — we'll populate SplashScreen/StatusBar/Keyboard plugin
  // configs in Chunk 2 after verifying basic boot.
  plugins: {},
}

export default config
