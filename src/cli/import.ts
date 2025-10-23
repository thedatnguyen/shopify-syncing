import "dotenv/config";
import { importAll } from "../import/importer.js";

const SRC_DOMAIN = process.env.SOURCE_STORE_DOMAIN!;
const TGT_DOMAIN = process.env.TARGET_STORE_DOMAIN!;
const TGT_TOKEN  = process.env.TARGET_ADMIN_TOKEN!;

async function main() {
  if (!SRC_DOMAIN || !TGT_DOMAIN || !TGT_TOKEN) {
    console.error("Missing SOURCE_STORE_DOMAIN / TARGET_STORE_DOMAIN / TARGET_ADMIN_TOKEN");
    process.exit(1);
  }

  await importAll({
    sourceDomain: SRC_DOMAIN,
    targetDomain: TGT_DOMAIN,
    targetToken : TGT_TOKEN,
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
