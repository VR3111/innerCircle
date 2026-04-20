import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

// Configure the native status bar as early as possible — before React mounts —
// so users never see a style flash between app launch and JS boot.
// The capacitor.config.ts plugins.StatusBar block covers the native-layer init;
// this call ensures the style is re-applied if the OS resets it (e.g. after
// backgrounding). Guarded by isNativePlatform() so it no-ops on web.
if (Capacitor.isNativePlatform()) {
  // Style.Light = light icons/text (white) — correct for a permanently dark app
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  // Keep WebView full-screen; current layout depends on contentInset:'always'
  // pushing content below the status bar, not on the WebView frame shrinking
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
