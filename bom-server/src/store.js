import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSeedData } from "./seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");
const storeFile = path.join(dataDir, "store.json");

function ensureStoreFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(storeFile, JSON.stringify(createSeedData(), null, 2), "utf8");
  }
}

export function readStore() {
  ensureStoreFile();
  return JSON.parse(fs.readFileSync(storeFile, "utf8"));
}

export function writeStore(nextStore) {
  ensureStoreFile();
  fs.writeFileSync(storeFile, JSON.stringify(nextStore, null, 2), "utf8");
  return nextStore;
}

export function updateStore(updater) {
  const currentStore = readStore();
  const nextStore = updater(currentStore) ?? currentStore;
  writeStore(nextStore);
  return nextStore;
}

export function resetStore() {
  return writeStore(createSeedData());
}
