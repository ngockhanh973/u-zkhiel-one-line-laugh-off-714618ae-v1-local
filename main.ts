import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_CHARS = 200;
const MIN_CHARS = 1;

function scriptDir(): string {
  const here = fileURLToPath(import.meta.url);
  return dirname(resolve(here));
}

function loadEntryText(folder: string): Buffer {
  const entryPath = join(folder, "entry.txt");
  try {
    return readFileSync(entryPath);
  } catch (cause) {
    throw new Error(`cannot read entry.txt next to main.ts at ${entryPath}: ${cause}`);
  }
}

function checkGate(raw: Buffer): string {
  const text = raw.toString("utf-8");
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error("gate failed: entry.txt is empty or only whitespace");
  }
  const charCount = [...text].length;
  if (charCount < MIN_CHARS || charCount > MAX_CHARS) {
    throw new Error(
      `gate failed: entry is ${charCount} characters, must be ${MIN_CHARS}-${MAX_CHARS}`
    );
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("gate failed: entry must be exactly one line");
  }
  return text;
}

function outputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv && fromEnv.trim().length > 0) {
    return resolve(fromEnv);
  }
  return resolve(scriptDir(), "out");
}

function main(): void {
  const folder = scriptDir();
  const raw = loadEntryText(folder);
  const text = checkGate(raw);
  const targetDir = outputDir();
  mkdirSync(targetDir, { recursive: true });
  const targetPath = join(targetDir, "entry.txt");
  writeFileSync(targetPath, raw);
  const writtenBack = readFileSync(targetPath);
  if (!writtenBack.equals(raw)) {
    throw new Error("verify failed: output bytes differ from entry.txt");
  }
  const chars = [...text].length;
  console.log(`ok: wrote ${chars} chars to ${targetPath}`);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
