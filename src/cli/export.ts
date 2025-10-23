import "dotenv/config";
import { exportAll } from "../export/exporter.js";

const SOURCE_STORE_DOMAIN = process.env.SOURCE_STORE_DOMAIN;
const SOURCE_ADMIN_TOKEN = process.env.SOURCE_ADMIN_TOKEN;

async function main() {
  if (!SOURCE_STORE_DOMAIN || !SOURCE_ADMIN_TOKEN) {
    console.error("Missing SOURCE_STORE_DOMAIN or SOURCE_ADMIN_TOKEN in .env");
    process.exit(1);
  }

  await exportAll({
    sourceDomain: SOURCE_STORE_DOMAIN,
    sourceToken: SOURCE_ADMIN_TOKEN
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
