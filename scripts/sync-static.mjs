import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const target = resolve(root, "public", "manual");

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await Promise.all([
  cp(resolve(root, "index.html"), resolve(target, "index.html")),
  cp(resolve(root, "styles.css"), resolve(target, "styles.css")),
  cp(resolve(root, "app.js"), resolve(target, "app.js")),
  cp(resolve(root, "og.png"), resolve(target, "og.png")),
  cp(resolve(root, "content"), resolve(target, "content"), { recursive: true }),
]);

console.log(`Synced standalone manual to ${target}`);
