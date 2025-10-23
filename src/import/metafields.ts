import { ShopifyAdmin } from "../lib/shopify.js";
import { chunk, sleep } from "./utils.js";
import {
  M_METAFIELDS_SET
} from "../queries/import/metafield.js";

export type MFNode = { namespace: string; key: string; type: string; value: string };

export async function setMetafields(admin: ShopifyAdmin, ownerId: string, nodes: MFNode[]) {
  // skip types we can't restore reliably
  const filtered = nodes.filter(n =>
    n.value != null &&
    n.value !== "" &&
    n.type !== "file_reference" // export không lấy reference → bỏ
  );

  const payloads = filtered.map(n => ({
    ownerId,
    namespace: n.namespace,
    key: n.key,
    type: n.type,
    value: String(n.value),
  }));

  for (const batch of chunk(payloads, 25)) {
    const res: any = await admin.gql(M_METAFIELDS_SET, { mfs: batch });
    const errs = res?.data?.metafieldsSet?.userErrors || [];
    if (errs.length) {
      // phần lớn là ACCESS_DENIED / DEFINITION_CONFLICT; log và tiếp tục
      console.warn("metafieldsSet userErrors:", errs.map((e:any)=>e.message));
    }
    await sleep(150);
  }
}
