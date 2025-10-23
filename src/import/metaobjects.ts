import { ShopifyAdmin } from "../lib/shopify.js";
import {
  M_METAOBJECT_DEF_CREATE,
  Q_METAOBJECT_BY_HANDLE,
  M_METAOBJECT_CREATE,
  M_METAOBJECT_UPDATE,
} from "../queries/import/metaobject.js";
import { sleep } from "./utils.js";

export type MODef = {
  name: string;
  type: string;
  access: { storefront: "PUBLIC_READ" | "NONE" };
  fieldDefinitions: { name: string; key: string; type: string; required: boolean; description: string; validations: { name: string; value?: string }[] }[];
};

export type MOEntry = {
  type: string;
  handle: string;
  fields: { key: string; type: string; value: string }[];
};

export async function upsertMetaobjectDefinition(admin: ShopifyAdmin, def: MODef) {
  const res: any = await admin.gql(M_METAOBJECT_DEF_CREATE, { def });
  const ue = res?.data?.metaobjectDefinitionCreate?.userErrors || [];
  if (ue.length) {
    const msg = ue.map((x:any)=>x.message).join(" | ");
    if (/already exists|reserved for use by another application/i.test(msg)) {
      return "SKIP";
    }
    if (/validations.*Field is not defined/i.test(msg)) {
      // thử lại không validations
      const def2 = { ...def, fieldDefinitions: def.fieldDefinitions.map(fd => ({ ...fd, validations: [] })) };
      const res2:any = await admin.gql(M_METAOBJECT_DEF_CREATE, { def: def2 });
      const ue2 = res2?.data?.metaobjectDefinitionCreate?.userErrors || [];
      if (ue2.length) {
        const msg2 = ue2.map((x:any)=>x.message).join(" | ");
        if (/already exists/i.test(msg2)) return "SKIP";
        throw new Error("MO definition error: " + msg2);
      }
      return "CREATED";
    }
    throw new Error("MO definition error: " + msg);
  }
  return "CREATED";
}

export async function upsertMetaobjectEntry(admin: ShopifyAdmin, entry: MOEntry) {
  // find existing
  const found: any = await admin.gql(Q_METAOBJECT_BY_HANDLE, { type: entry.type, handle: entry.handle });
  const id = found?.data?.metaobjectByHandle?.id as string | undefined;

  const fields = entry.fields
    .filter(f => f.value != null && f.value !== "" && f.type !== "file_reference")
    .map(f => ({ key: f.key, type: f.type, value: String(f.value) }));

  if (!id) {
    // create
    const res:any = await admin.gql(M_METAOBJECT_CREATE, { input: { type: entry.type, handle: entry.handle, fields } });
    const ue = res?.data?.metaobjectCreate?.userErrors || [];
    if (ue.length) {
      const msg = ue.map((x:any)=>x.message).join(" | ");
      if (/already exists/i.test(msg)) return "SKIP";
      throw new Error("MO create error: " + msg);
    }
    await sleep(120);
    return "CREATED";
  } else {
    // update (overwrite fields)
    const res:any = await admin.gql(M_METAOBJECT_UPDATE, { id, fields });
    const ue = res?.data?.metaobjectUpdate?.userErrors || [];
    if (ue.length) {
      const msg = ue.map((x:any)=>x.message).join(" | ");
      throw new Error("MO update error: " + msg);
    }
    await sleep(120);
    return "UPDATED";
  }
}
