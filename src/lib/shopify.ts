import { fetch } from "undici";

type BulkPollResult = {
  status: string;
  url: string | null;
  partialDataUrl: string | null;
  objectCount: string | null;
  errorCode?: string | null;
};

export class ShopifyAdmin {
  constructor(
    private domain: string,
    private token: string,
    private apiVersion: string = "2024-10"
  ) {}

  private endpoint() {
    return `https://${this.domain}/admin/api/${this.apiVersion}/graphql.json`;
  }

  async gql<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const r = await fetch(this.endpoint(), {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": this.token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query, variables })
    });
    const data = (await r.json()) as any;
    if (data.errors) throw new Error(JSON.stringify(data.errors, null, 2));
    const userErrors = data?.data?.bulkOperationRunQuery?.userErrors;
    if (Array.isArray(userErrors) && userErrors.length) {
      throw new Error(JSON.stringify(userErrors, null, 2));
    }
    return data;
  }

  private async pollBulk(): Promise<BulkPollResult> {
    while (true) {
      const q = `{ currentBulkOperation { status errorCode objectCount url partialDataUrl } }`;
      const r: any = await this.gql(q);
      const op = r?.data?.currentBulkOperation as BulkPollResult | null;
      if (!op) throw new Error("No bulk op found");
      if (op.status === "COMPLETED") return op;
      if (op.status === "FAILED" || op.status === "CANCELED") {
        throw new Error(op.errorCode || op.status);
      }
      await new Promise((res) => setTimeout(res, 2500));
    }
  }

  async runBulkToFile(name: string, query: string, outPath: string): Promise<string> {
    console.log(`Starting bulk export: ${name}`);
    await this.gql(`
      mutation Bulk { bulkOperationRunQuery(query: ${JSON.stringify(query)}) {
        bulkOperation { id status } userErrors { field message }
      } }
    `);

    const op = await this.pollBulk();
    const downloadUrl = op.url || op.partialDataUrl; // <-- fallback
    const count = op.objectCount ? Number(op.objectCount) : 0;
    if (!downloadUrl) {
      console.log(`No data for ${name} (objectCount=${count}). Skipped writing file.`);
      // vẫn tạo file rỗng cho nhất quán (tuỳ chọn)
      const { writeFile } = await import("./fs.js");
      writeFile(outPath, "");
      return outPath;
    }

    console.log(`Downloading ${name} from: ${downloadUrl}`);
    const res = await fetch(downloadUrl);
    const text = await res.text();
    const { writeFile } = await import("./fs.js");
    writeFile(outPath, text ?? "");
    console.log(`Saved: ${outPath}`);
    return outPath;
  }

  async runBulkToText(query: string): Promise<string> {
    await this.gql(`
      mutation Bulk { bulkOperationRunQuery(query: ${JSON.stringify(query)}) {
        bulkOperation { id status } userErrors { field message }
      } }
    `);
    const op = await this.pollBulk();
    const downloadUrl = op.url || op.partialDataUrl; // <-- fallback
    const count = op.objectCount ? Number(op.objectCount) : 0;
    if (!downloadUrl) {
      console.log(`Bulk returned no data (objectCount=${count}).`);
      return ""; // trả về rỗng để caller tự bỏ qua
    }
    const res = await fetch(downloadUrl);
    return await res.text();
  }

  async fetchAllMetaobjectTypes(): Promise<string[]> {
    let types: string[] = [];
    let after: string | null = null;
    while (true) {
      const q = `
        query getTypes($after: String) {
          metaobjectDefinitions(first: 250, after: $after) {
            edges { node { type } }
            pageInfo { hasNextPage endCursor }
          }
        }
      `;
      const data: any = await this.gql(q, { after });
      const conn = data?.data?.metaobjectDefinitions;
      types.push(...(conn?.edges || []).map((e: any) => e.node.type).filter(Boolean));
      if (!conn?.pageInfo?.hasNextPage) break;
      after = conn.pageInfo.endCursor;
    }
    return Array.from(new Set(types)).sort();
  }
}
