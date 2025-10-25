// src/import/report.ts
import fs from "fs";
import path from "path";

export function timestamp() {
  const d = new Date();
  const pad = (n:number)=>String(n).padStart(2,"0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export class ImportReport {
  readonly dir: string;

  constructor(targetDomain: string, runId?: string) {
    const ts = runId || timestamp();
    const safe = (targetDomain || "unknown").replace(/[^\w.-]/g, "_");
    this.dir = path.resolve(`./import_reports/${safe}/${ts}`);
    fs.mkdirSync(this.dir, { recursive: true });
  }

  path(file: string) {
    return path.join(this.dir, file);
  }

  appendJSONL(file: string, payload: any) {
    const out = JSON.stringify(payload) + "\n";
    fs.appendFileSync(this.path(file), out, "utf8");
  }

  appendLine(file: string, text: string) {
    fs.appendFileSync(this.path(file), text.endsWith("\n") ? text : text + "\n");
  }

  // summary
  summary(kv: Record<string, any>) {
    this.appendLine("summary.txt", Object.entries(kv).map(([k,v]) => `${k}: ${v}`).join("\n") + "\n");
  }
}
