import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "Arena-Agent.zip");

const r = spawnSync(
  "zip",
  [
    "-r",
    out,
    ".",
    "-x",
    "node_modules/*",
    "-x",
    ".git/*",
    "-x",
    "dist/*",
    "-x",
    "src-tauri/target/*",
    "-x",
    "src-tauri/gen/*",
    "-x",
    "*.zip",
    "-x",
    ".cache/*",
  ],
  { cwd: root, stdio: "inherit" },
);

process.exit(r.status ?? 1);
