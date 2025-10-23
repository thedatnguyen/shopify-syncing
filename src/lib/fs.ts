import fs from "fs";
import path from "path";

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeFile(outPath: string, text: string) {
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, text ?? "", "utf8");
}

export function appendFile(outPath: string, text: string) {
  ensureDir(path.dirname(outPath));
  const add = text.length && !text.endsWith("\n") ? text + "\n" : text;
  fs.appendFileSync(outPath, add, "utf8");
}

export function safeDomain(domain: string | undefined) {
  return (domain || "unknown").replace(/[^\w.-]/g, "_");
}
