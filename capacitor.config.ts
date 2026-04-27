import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.socialleveling.app',
  appName: 'Social Leveling',
  webDir: 'dist',
  // Bundled mode: no server.url. App loads from local dist bundle.
  // This is the App Store compliant path (Apple rejects pure webview wrappers).
  ios: {
    backgroundColor: '#0A0A0A',
    // Prevents WKWebView scroll bounce at top/bottom (feels more native)
    scrollEnabled: true,
  },
  plugins: {
    StatusBar: {
      // LIGHT = light icons/text (white) — correct for a permanently dark app.
      // Applied natively before JS loads so there is no style flash on launch.
      style: 'LIGHT',
      // Keep the WebView full-screen. The native scroll layer (contentInset:
      // 'always') already pushes content below the status bar without any
      // CSS changes. Switching to false would shift the WebView frame.
      overlaysWebView: true,
    },
  },
}

export default config
