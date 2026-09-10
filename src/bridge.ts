import type { Key } from "./i18n";

const AGENT = "https://arena.ai/agent";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function isBridgeOn(): boolean {
  return localStorage.getItem("arena.bridge") === "1";
}

export function setBridgeOn(on: boolean): void {
  localStorage.setItem("arena.bridge", on ? "1" : "0");
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (isTauri()) {
      const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
      await writeText(text);
      return true;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function readClipboard(): Promise<string> {
  if (isTauri()) {
    const { readText } = await import("@tauri-apps/plugin-clipboard-manager");
    return (await readText()) ?? "";
  }
  return navigator.clipboard.readText();
}

export async function runBridge(
  action: string,
  t: (k: Key) => string,
): Promise<string> {
  if (!isBridgeOn() && action !== "toggle") {
    return t("disabled");
  }

  switch (action) {
    case "screenshot": {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const track = stream.getVideoTracks()[0];
      const shot =
        "ImageCapture" in window
          ? await new ImageCapture(track).grabFrame()
          : await grabFrame(track);
      track.stop();
      stream.getTracks().forEach((tr) => tr.stop());
      const blob = await frameToPng(shot);
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      } catch {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "arena-agent-shot.png";
        a.click();
        URL.revokeObjectURL(url);
      }
      return t("shotOk");
    }
    case "clipboard": {
      try {
        const text = await readClipboard();
        if (!text) return t("clipEmpty");
        return `${t("clip")}: ${text.slice(0, 180)}`;
      } catch {
        const sample = "Arena Agent";
        const ok = await writeClipboard(sample);
        return ok ? t("copied") : t("needPerm");
      }
    }
    case "files": {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.click();
      return t("filesPicked");
    }
    case "voice": {
      const SR = (window as unknown as {
        SpeechRecognition?: new () => SpeechRec;
        webkitSpeechRecognition?: new () => SpeechRec;
      }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec })
          .webkitSpeechRecognition;
      if (!SR) return t("voiceOff");
      const rec = new SR();
      rec.lang = document.documentElement.lang || "ar";
      rec.onresult = async (ev: { results: { 0: { 0: { transcript: string } } } }) => {
        await writeClipboard(ev.results[0][0].transcript);
      };
      rec.start();
      return t("copied");
    }
    case "notify": {
      if (isTauri()) {
        const { sendNotification, isPermissionGranted, requestPermission } =
          await import("@tauri-apps/plugin-notification");
        let granted = await isPermissionGranted();
        if (!granted) granted = (await requestPermission()) === "granted";
        if (!granted) return t("needPerm");
        sendNotification({ title: "Arena Agent", body: AGENT });
        return t("notified");
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return t("needPerm");
      new Notification("Arena Agent", { body: AGENT });
      return t("notified");
    }
    case "share": {
      if (navigator.share) {
        await navigator.share({ title: "Agent Mode", url: AGENT });
        return t("shared");
      }
      await writeClipboard(AGENT);
      return t("copied");
    }
    case "open-app": {
      if (!window.confirm(t("openApp"))) return t("cancelled");
      const input = document.createElement("input");
      input.type = "file";
      input.click();
      return t("filesPicked");
    }
    case "run-cmd": {
      const raw = (document.getElementById("cu-cmd") as HTMLInputElement | null)?.value.trim() ?? "";
      if (!raw) return t("cmdPh");
      if (!window.confirm(`${t("runConfirm")}\n${raw}`)) return t("cancelled");
      if (/^https?:\/\//i.test(raw)) {
        window.open(raw, "agent-frame");
        return t("opened");
      }
      return t("filesPicked");
    }
    case "github":
      return "github";
    default:
      return "";
  }
}

interface SpeechRec {
  lang: string;
  start: () => void;
  onresult: ((ev: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
}

async function grabFrame(track: MediaStreamTrack): Promise<ImageBitmap> {
  const video = document.createElement("video");
  video.srcObject = new MediaStream([track]);
  await video.play();
  const bmp = await createImageBitmap(video);
  video.pause();
  video.srcObject = null;
  return bmp;
}

async function frameToPng(frame: ImageBitmap): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(frame, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png");
  });
}

declare class ImageCapture {
  constructor(track: MediaStreamTrack);
  grabFrame(): Promise<ImageBitmap>;
}
