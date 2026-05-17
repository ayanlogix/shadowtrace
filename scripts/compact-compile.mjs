import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractDir = path.join(root, "contract");

function isWindowsSystemCompact(candidate) {
  const normalized = path.normalize(candidate).toLowerCase();
  return normalized.endsWith(path.normalize("Windows/System32/compact.exe").toLowerCase());
}

function existing(...parts) {
  const candidate = path.join(...parts);
  return fs.existsSync(candidate) ? candidate : null;
}

function findCompactBin() {
  if (process.env.COMPACT_BIN) {
    return process.env.COMPACT_BIN;
  }

  const home = process.env.USERPROFILE ?? process.env.HOME ?? "";
  const candidates = [
    existing(home, ".local", "bin", "compact.exe"),
    existing(home, ".local", "bin", "compact"),
    existing(home, ".compact", "bin", "compact.exe"),
    existing(home, ".compact", "bin", "compact"),
    existing(home, "AppData", "Local", "Midnight", "compact", "compact.exe"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!isWindowsSystemCompact(candidate)) return candidate;
  }

  if (process.platform === "win32") {
    const whereResult = spawnSync("where.exe", ["compact"], { encoding: "utf8" });
    const matches = whereResult.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !isWindowsSystemCompact(line));

    if (matches[0]) return matches[0];
  }

  return "compact";
}

const compactBin = findCompactBin();

if (process.platform === "win32" && isWindowsSystemCompact(compactBin)) {
  console.error(
    "Refusing to run C:\\Windows\\System32\\compact.exe. That is the Windows NTFS compression tool, not the Midnight Compact compiler.",
  );
  console.error("Set COMPACT_BIN to the real Midnight Compact compiler executable and rerun `npm run build:contract`.");
  process.exit(1);
}

const result = spawnSync(
  compactBin,
  ["compile", "src/age-verify.compact", "src/managed/age-verify"],
  {
    cwd: contractDir,
    shell: process.platform === "win32",
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
