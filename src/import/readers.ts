import { loadLines } from "./utils.js";

export type MFNode = { namespace: string; key: string; type: string; value: string };

export function readProductsJsonl(p: string) {
  const lines = loadLines(p);
  type Product = { handle: string; metafields: MFNode[]; variants: { sku: string; metafields: MFNode[] }[] };
  const products = new Map<string, Product>(); // key: productId
  const byHandle: Record<string, string> = {};

  for (const line of lines) {
    let obj:any; try { obj = JSON.parse(line); } catch { continue; }
    if (!obj) continue;

    // product node
    if (obj.handle && obj.metafields && !obj.sku) {
      products.set(obj.id, {
        handle: obj.handle,
        metafields: toMF(obj.metafields),
        variants: []
      });
      byHandle[obj.handle] = obj.id;
    }
    // variant node
    if (obj.sku != null && obj.metafields) {
      const parentId = obj.__parentId;
      const parent = products.get(parentId);
      if (parent) {
        parent.variants.push({ sku: obj.sku, metafields: toMF(obj.metafields) });
      }
    }
  }
  return { products: [...products.values()], byHandle };
}

export function readCollectionsJsonl(p: string) {
  const lines = loadLines(p);
  type Collection = { handle: string; metafields: MFNode[] };
  const out: Collection[] = [];
  for (const line of lines) {
    let obj:any; try { obj = JSON.parse(line); } catch { continue; }
    if (obj.handle && obj.metafields) {
      out.push({ handle: obj.handle, metafields: toMF(obj.metafields) });
    }
  }
  return out;
}

export function readPagesJsonl(p: string) {
  const lines = loadLines(p);
  type Page = { handle: string; metafields: MFNode[] };
  const out: Page[] = [];
  for (const line of lines) {
    let obj:any; try { obj = JSON.parse(line); } catch { continue; }
    if (obj.handle && obj.metafields) {
      out.push({ handle: obj.handle, metafields: toMF(obj.metafields) });
    }
  }
  return out;
}

export function readBlogsJsonl(p: string) {
  const lines = loadLines(p);
  type Blog = { id: string; handle: string; metafields: MFNode[] };
  type Article = { blogHandle: string; handle: string; metafields: MFNode[] };
  const blogs = new Map<string, Blog>(); // key: blogId
  const articles: Article[] = [];

  for (const line of lines) {
    let obj:any; try { obj = JSON.parse(line); } catch { continue; }
    if (!obj) continue;

    if (obj.handle && obj.metafields && obj.id && !obj.title) {
      // blog node (article có title)
      blogs.set(obj.id, { id: obj.id, handle: obj.handle, metafields: toMF(obj.metafields) });
    }
    if (obj.handle && obj.metafields && obj.title) {
      const blogId = obj.__parentId;
      const blog = blogs.get(blogId);
      const blogHandle = blog?.handle || "";
      articles.push({ blogHandle, handle: obj.handle, metafields: toMF(obj.metafields) });
    }
  }

  return {
    blogs: [...blogs.values()].map(b => ({ handle: b.handle, metafields: b.metafields })),
    articles
  };
}

export function readCustomersJsonl(p: string) {
  const lines = loadLines(p);
  type Customer = { email: string; metafields: MFNode[] };
  const out: Customer[] = [];
  for (const line of lines) {
    let obj:any; try { obj = JSON.parse(line); } catch { continue; }
    if (obj.email && obj.metafields) {
      out.push({ email: obj.email, metafields: toMF(obj.metafields) });
    }
  }
  return out;
}

export function readShopJsonl(p: string) {
  const lines = loadLines(p);
  // file shop.jsonl có 1 node shop -> metafields
  for (const line of lines) {
    let obj:any; try { obj = JSON.parse(line); } catch { continue; }
    if (obj.metafields && !obj.handle) {
      return toMF(obj.metafields);
    }
  }
  return [];
}

export function readMetaobjectsJsonl(p: string) {
  const lines = loadLines(p);
  type Entry = { type: string; handle: string; fields: { key: string; type: string; value: string }[] };
  const out: Entry[] = [];
  for (const line of lines) {
    let obj:any; try { obj = JSON.parse(line); } catch { continue; }
    if (obj.type && obj.handle && obj.fields) {
      out.push({
        type: obj.type,
        handle: obj.handle,
        fields: (obj.fields || []).map((f:any)=>({ key: f.key, type: f.type, value: String(f.value ?? "") }))
      });
    }
  }
  return out;
}

function toMF(conn:any): MFNode[] {
  const edges = conn?.edges || [];
  return edges.map((e:any)=>e.node).filter((n:any)=>n && n.namespace && n.key && n.type != null && n.value != null)
    .map((n:any)=>({ namespace:n.namespace, key:n.key, type:n.type, value: String(n.value) }));
}
