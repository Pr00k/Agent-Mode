import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor 8 — Android / iOS WebView shell.
 * server.url is unset so production uses bundled dist/.
 * Keep-awake + https schemes so Agent work survives screen lock.
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
    backgroundMode: ["fetch", "processing"],
  },
  server: {
    androidScheme: "https",
    iosScheme: "https",
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
    KeepAwake: {
      enabled: true,
    },
  },
};

export default config;
