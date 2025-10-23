import path from "path";
import { ShopifyAdmin } from "../lib/shopify.js";
import { ensureDir, writeFile, appendFile, safeDomain } from "../lib/fs.js";
import { Q_DEFINITIONS_BATCH_1 } from "../queries/export/definitionsBatch1.js";
import { Q_DEFINITIONS_BATCH_2 } from "../queries/export/definitionsBatch2.js";
import { Q_PRODUCTS } from "../queries/export/products.js";
import { Q_COLLECTIONS } from "../queries/export/collections.js";
import { Q_PAGES } from "../queries/export/pages.js";
import { Q_BLOGS } from "../queries/export/blogs.js";
import { Q_CUSTOMERS } from "../queries/export/customers.js";
import { Q_SHOP } from "../queries/export/shop.js";
import { Q_METAOBJECTS_BY_TYPE } from "../queries/export/metaobjectsByType.js";

export async function exportAll({
  sourceDomain,
  sourceToken
}: {
  sourceDomain: string;
  sourceToken: string;
}) {
  const admin = new ShopifyAdmin(sourceDomain, sourceToken);
  const outDir = path.resolve(`./data_exported/${safeDomain(sourceDomain)}`);
  ensureDir(outDir);

  // Definitions (2 bulk → gộp 1 file nếu muốn, còn đây mình lưu 2 file giống bạn đang làm)
  await admin.runBulkToFile("definitions_batch_1", Q_DEFINITIONS_BATCH_1, path.join(outDir, "definitions_batch_1.jsonl"));
  await admin.runBulkToFile("definitions_batch_2", Q_DEFINITIONS_BATCH_2, path.join(outDir, "definitions_batch_2.jsonl"));

  // Các nhóm khác
  await admin.runBulkToFile("products", Q_PRODUCTS, path.join(outDir, "products.jsonl"));
  await admin.runBulkToFile("collections", Q_COLLECTIONS, path.join(outDir, "collections.jsonl"));
  await admin.runBulkToFile("pages", Q_PAGES, path.join(outDir, "pages.jsonl"));
  await admin.runBulkToFile("blogs", Q_BLOGS, path.join(outDir, "blogs.jsonl"));
  await admin.runBulkToFile("customers", Q_CUSTOMERS, path.join(outDir, "customers.jsonl"));
  await admin.runBulkToFile("shop", Q_SHOP, path.join(outDir, "shop.jsonl"));

  // Metaobjects: cần type → lặp theo type, append chung một file
  const types = await admin.fetchAllMetaobjectTypes();
  const moOut = path.join(outDir, "metaobjects.jsonl");
  writeFile(moOut, ""); // clear file

  for (const t of types) {
    console.log(`Exporting metaobjects type="${t}"`);
    const text = await admin.runBulkToText(Q_METAOBJECTS_BY_TYPE(t));
    if (!text || text.trim().length === 0) {
      // không có entry cho type này → bỏ qua
      continue;
    }
    appendFile(moOut, text);
  }

  console.log("Done. JSONL written to:", outDir);
}
