import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "contract", "src", "managed", "age-verify");
const target = path.join(root, "public", "zk", "age-verify");

for (const directory of ["keys", "zkir"]) {
  const sourceDir = path.join(source, directory);
  const targetDir = path.join(target, directory);

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Missing ${sourceDir}. Run the Compact compiler first.`);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

console.log("ZK assets synced to public/zk/age-verify");
