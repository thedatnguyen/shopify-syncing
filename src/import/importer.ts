import path from "path";
import { ShopifyAdmin } from "../lib/shopify.js";
import { sleep } from "./utils.js";
import {
  readProductsJsonl,
  readCollectionsJsonl,
  readPagesJsonl,
  readBlogsJsonl,
  readCustomersJsonl,
  readShopJsonl,
  readMetaobjectsJsonl,
} from "./readers.js";
import {
  setMetafields
} from "./metafields.js";
import {
  upsertMetaobjectDefinition, upsertMetaobjectEntry
} from "./metaobjects.js";
import {
  OWNER_TYPES,
  Q_FETCH_MF_DEFS,
  M_METAFIELD_DEF_CREATE
} from "../queries/import/metafield.js";
import {
  Q_FETCH_MO_DEFS
} from "../queries/import/metaobject.js";
import {
  Q_SHOP_ID,
  Q_PRODUCT_BY_HANDLE,
  Q_COLLECTION_BY_HANDLE,
  Q_PAGE_BY_HANDLE,
  Q_BLOG_BY_HANDLE,
  Q_ARTICLE_BY_HANDLE,
  Q_CUSTOMER_BY_EMAIL,
  Q_VARIANT_BY_SKU
} from "../queries/import/owners.js";

/* ---------- helpers: lookups ---------- */
async function getShopId(admin: ShopifyAdmin) {
  const res:any = await admin.gql(Q_SHOP_ID);
  return res?.data?.shop?.id as string;
}
async function getProductId(admin: ShopifyAdmin, handle: string) {
  const r:any = await admin.gql(Q_PRODUCT_BY_HANDLE, { handle });
  return r?.data?.productByHandle?.id as string | undefined;
}
async function getVariantIdBySku(admin: ShopifyAdmin, sku: string) {
  if (!sku) return undefined;
  const r:any = await admin.gql(Q_VARIANT_BY_SKU, { q: `sku:${JSON.stringify(sku).slice(1,-1)}` });
  const node = r?.data?.productVariants?.edges?.[0]?.node;
  return node?.id as string | undefined;
}
async function getCollectionId(admin: ShopifyAdmin, handle: string) {
  const r:any = await admin.gql(Q_COLLECTION_BY_HANDLE, { handle });
  return r?.data?.collectionByHandle?.id as string | undefined;
}
async function getPageId(admin: ShopifyAdmin, handle: string) {
  const r:any = await admin.gql(Q_PAGE_BY_HANDLE, { handle });
  return r?.data?.pageByHandle?.id as string | undefined;
}
async function getBlogId(admin: ShopifyAdmin, handle: string) {
  const r:any = await admin.gql(Q_BLOG_BY_HANDLE, { handle });
  return r?.data?.blogByHandle?.id as string | undefined;
}
async function getArticleId(admin: ShopifyAdmin, blogHandle: string, handle: string) {
  const r:any = await admin.gql(Q_ARTICLE_BY_HANDLE, { blogHandle, handle });
  return r?.data?.articleByHandle?.id as string | undefined;
}
async function getCustomerIdByEmail(admin: ShopifyAdmin, email: string) {
  if (!email) return undefined;
  const r:any = await admin.gql(Q_CUSTOMER_BY_EMAIL, { q: `email:${JSON.stringify(email).slice(1,-1)}` });
  const node = r?.data?.customers?.edges?.[0]?.node;
  return node?.id as string | undefined;
}

/* ---------- import definitions (re-use from earlier) ---------- */
async function fetchExistingDefs(admin: ShopifyAdmin) {
  // MF defs
  const existingMfKeys = new Set<string>();
  for (const ownerType of OWNER_TYPES) {
    let after: string | null = null;
    while (true) {
      const { data }: any = await admin.gql(Q_FETCH_MF_DEFS(ownerType), { after });
      const conn = data?.metafieldDefinitions;
      (conn?.edges || []).forEach((e: any) => {
        const n = e.node;
        existingMfKeys.add(`${n.ownerType}::${n.namespace}::${n.key}`);
      });
      if (!conn?.pageInfo?.hasNextPage) break;
      after = conn.pageInfo.endCursor;
      await sleep(120);
    }
  }
  // MO defs
  const existingMoTypes = new Set<string>();
  let after: string | null = null;
  while (true) {
    const { data }: any = await admin.gql(Q_FETCH_MO_DEFS, { after });
    const conn = data?.metaobjectDefinitions;
    (conn?.edges || []).forEach((e: any) => existingMoTypes.add(e.node.type));
    if (!conn?.pageInfo?.hasNextPage) break;
    after = conn.pageInfo.endCursor;
    await sleep(120);
  }
  return { existingMfKeys, existingMoTypes };
}

function toValidations(list:any[]) {
  if (!Array.isArray(list)) return [];
  return list.map(v => v?.name ? ({ name: String(v.name), ...(v.value!=null?{value:String(v.value)}:{}) }) : null).filter(Boolean);
}

async function importDefinitionsFromFiles(admin: ShopifyAdmin, sourceDomain: string) {
  const input1 = path.resolve(`./data_exported/${sourceDomain}/definitions_batch_1.jsonl`);
  const input2 = path.resolve(`./data_exported/${sourceDomain}/definitions_batch_2.jsonl`);

  // parse
  const lines1 = (await import("fs")).readFileSync(input1, "utf8").split("\n").filter(Boolean);
  const lines2 = (await import("fs")).readFileSync(input2, "utf8").split("\n").filter(Boolean);
  const lines = [...lines1, ...lines2];

  type MfDef = { name:string; namespace:string; key:string; ownerType:string; type:string; description:string; validations:any[] };
  type MoDef = { name:string; type:string; access:{storefront:string}; fieldDefinitions:any[] };

  const mfDefs = new Map<string, MfDef>();
  const moDefs = new Map<string, MoDef>();

  for (const line of lines) {
    let obj:any; try { obj = JSON.parse(line); } catch { continue; }
    if (!obj) continue;

    if (obj.namespace && obj.key && obj.ownerType && (obj.type || obj.type?.name)) {
      const k = `${obj.ownerType}::${obj.namespace}::${obj.key}`;
      if (!mfDefs.has(k)) {
        mfDefs.set(k, {
          name: obj.name || `${obj.namespace}.${obj.key}`,
          namespace: obj.namespace,
          key: obj.key,
          ownerType: obj.ownerType,
          type: typeof obj.type === "string" ? obj.type : (obj.type?.name || "single_line_text_field"),
          description: obj.description || "",
          validations: toValidations(obj.validations),
        });
      }
      continue;
    }

    if ((typeof obj.type === "string" || obj.type?.name) && Array.isArray(obj.fieldDefinitions)) {
      const t = typeof obj.type === "string" ? obj.type : obj.type?.name;
      if (t && !moDefs.has(t)) {
        moDefs.set(t, {
          name: obj.name || t,
          type: t,
          access: { storefront: "PUBLIC_READ" },
          fieldDefinitions: (obj.fieldDefinitions || []).map((f:any)=>({
            name: f.name || f.key,
            key: f.key,
            type: typeof f.type === "string" ? f.type : (f.type?.name || "single_line_text_field"),
            required: !!f.required,
            description: f.description || "",
            validations: toValidations(f.validations),
          })),
        });
      }
      continue;
    }
  }

  // fetch existing
  const { existingMfKeys, existingMoTypes } = await fetchExistingDefs(admin);

  // upsert MF defs
  for (const [key, def] of mfDefs.entries()) {
    if (existingMfKeys.has(key)) continue;
    try {
      const res:any = await admin.gql(M_METAFIELD_DEF_CREATE, { def });
      const ue = res?.data?.metafieldDefinitionCreate?.userErrors || [];
      if (ue.length) {
        const msg = ue.map((x:any)=>x.message).join(" | ");
        if (/already exists|Key is in use|Access denied/i.test(msg)) continue;
        if (/validations.*Field is not defined/i.test(msg)) {
          await admin.gql(M_METAFIELD_DEF_CREATE, { def: { ...def, validations: [] } });
        }
      }
    } catch {}
    await sleep(120);
  }

  // upsert MO defs
  for (const [typeName, def] of moDefs.entries()) {
    if (existingMoTypes.has(typeName)) continue;
    try {
      await upsertMetaobjectDefinition(admin, def as any);
    } catch (e) {
      console.warn("MO def:", typeName, e);
    }
    await sleep(120);
  }
}

/* ---------- import values for each entity ---------- */
export async function importAll({
  sourceDomain, targetDomain, targetToken
}: { sourceDomain: string; targetDomain: string; targetToken: string; }) {
  const admin = new ShopifyAdmin(targetDomain, targetToken);

  // 0) definitions first
  await importDefinitionsFromFiles(admin, sourceDomain);

  // 1) shop metafields
  try {
    const shopMFPath = path.resolve(`./data_exported/${sourceDomain}/shop.jsonl`);
    const shopMf = readShopJsonl(shopMFPath);
    const shopId = await getShopId(admin);
    if (shopId && shopMf.length) await setMetafields(admin, shopId, shopMf);
  } catch (e) { console.warn("shop import warn:", (e as any)?.message || e); }

  // 2) products + variants
  try {
    const prodPath = path.resolve(`./data_exported/${sourceDomain}/products.jsonl`);
    const { products } = readProductsJsonl(prodPath);
    for (const p of products) {
      const pid = await getProductId(admin, p.handle);
      if (pid) {
        if (p.metafields.length) await setMetafields(admin, pid, p.metafields);
        for (const v of p.variants) {
          const vid = await getVariantIdBySku(admin, v.sku);
          if (vid && v.metafields.length) await setMetafields(admin, vid, v.metafields);
          await sleep(120);
        }
      }
      await sleep(120);
    }
  } catch (e) { console.warn("products import warn:", (e as any)?.message || e); }

  // 3) collections
  try {
    const colPath = path.resolve(`./data_exported/${sourceDomain}/collections.jsonl`);
    const cols = readCollectionsJsonl(colPath);
    for (const c of cols) {
      const cid = await getCollectionId(admin, c.handle);
      if (cid && c.metafields.length) await setMetafields(admin, cid, c.metafields);
      await sleep(120);
    }
  } catch (e) { console.warn("collections import warn:", (e as any)?.message || e); }

  // 4) pages
  try {
    const pagePath = path.resolve(`./data_exported/${sourceDomain}/pages.jsonl`);
    const pages = readPagesJsonl(pagePath);
    for (const pg of pages) {
      const id = await getPageId(admin, pg.handle);
      if (id && pg.metafields.length) await setMetafields(admin, id, pg.metafields);
      await sleep(120);
    }
  } catch (e) { console.warn("pages import warn:", (e as any)?.message || e); }

  // 5) blogs & articles
  try {
    const blogPath = path.resolve(`./data_exported/${sourceDomain}/blogs.jsonl`);
    const { blogs, articles } = readBlogsJsonl(blogPath);
    // blogs
    for (const b of blogs) {
      const bid = await getBlogId(admin, b.handle);
      if (bid && b.metafields.length) await setMetafields(admin, bid, b.metafields);
      await sleep(120);
    }
    // articles
    for (const a of articles) {
      if (!a.blogHandle) continue;
      const aid = await getArticleId(admin, a.blogHandle, a.handle);
      if (aid && a.metafields.length) await setMetafields(admin, aid, a.metafields);
      await sleep(120);
    }
  } catch (e) { console.warn("blogs/articles import warn:", (e as any)?.message || e); }

  // 6) customers
  try {
    const cusPath = path.resolve(`./data_exported/${sourceDomain}/customers.jsonl`);
    const customers = readCustomersJsonl(cusPath);
    for (const c of customers) {
      const id = await getCustomerIdByEmail(admin, c.email);
      if (id && c.metafields.length) await setMetafields(admin, id, c.metafields);
      await sleep(120);
    }
  } catch (e) { console.warn("customers import warn:", (e as any)?.message || e); }

  // 7) metaobject entries
  try {
    const moPath = path.resolve(`./data_exported/${sourceDomain}/metaobjects.jsonl`);
    const entries = readMetaobjectsJsonl(moPath);
    for (const en of entries) {
      try { await upsertMetaobjectEntry(admin, en); } catch (e) { console.warn("MO entry:", en.type, en.handle, e); }
      await sleep(120);
    }
  } catch (e) { console.warn("metaobjects import warn:", (e as any)?.message || e); }

  console.log("✅ Import completed (definitions + all entity metafields + metaobject entries).");
}
