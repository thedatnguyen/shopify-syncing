import fs from "fs";

export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export function loadLines(filePath: string): string[] {
  const text = fs.readFileSync(filePath, "utf8");
  return text.split("\n").filter(Boolean);
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
