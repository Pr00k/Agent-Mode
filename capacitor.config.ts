import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor 7 schema — Android / iOS WebView shell.
 * Server.url is unset so production uses bundled dist/.
 * For live reload on a device, set server.url to the Vite LAN address.
 */
const config: CapacitorConfig = {
  appId: "ai.arena.agent",
  appName: "Arena Agent",
  webDir: "dist",
  backgroundColor: "#07070c",
  android: {
    allowMixedContent: false,
    backgroundColor: "#07070c",
    webContentsDebuggingEnabled: false,
  },
  ios: {
    backgroundColor: "#07070c",
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 400,
      backgroundColor: "#07070c",
      showSpinner: false,
    },
    Keyboard: {
      resize: "body",
    },
  },
};

export default config;
