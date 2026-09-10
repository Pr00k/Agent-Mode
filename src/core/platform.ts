export type PlatformCapabilities = {
  screenshot: boolean;
  clipboard: boolean;
  notifications: boolean;
  files: boolean;
  microphone: boolean;
  share: boolean;
  wakeLock: boolean;
  serviceWorker: boolean;
  tauri: boolean;
  standalone: boolean;
};

export function detectPlatform(): PlatformCapabilities {
  const tauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  const standalone =
    tauri ||
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return {
    screenshot: typeof navigator.mediaDevices?.getDisplayMedia === "function",
    clipboard: Boolean(navigator.clipboard),
    notifications: typeof Notification !== "undefined",
    files: typeof document !== "undefined",
    microphone:
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    share: typeof navigator.share === "function",
    wakeLock: "wakeLock" in navigator,
    serviceWorker: "serviceWorker" in navigator && !tauri,
    tauri,
    standalone,
  };
}
