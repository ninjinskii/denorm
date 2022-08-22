import { QueryObjectResult } from "https://deno.land/x/postgres@v0.16.1/query/query.ts";
import { Client, Transaction } from "../../deps.ts";
import { FieldTransformer } from "./query-builder.ts";
import { PreparedQuery } from "./query-part.ts";

export class QueryExecutor {
  private client: Client | null = null;
  private transaction: Transaction | null = null;
  private databaseUrl: string;
  private transformer: FieldTransformer;
  private useNativeCamel = false;

  constructor(databaseUrl: string, transformer: FieldTransformer) {
    this.databaseUrl = databaseUrl;
    this.transformer = transformer;

    if (this.transformer.usePostgresNativeCamel) {
      this.useNativeCamel = true;
    }
  }

  private async init() {
    const client = new Client(this.databaseUrl);
    await client.connect();

    this.client = client;
  }

  isInitialized(): boolean {
    return this.client !== null;
  }

  async submitQuery<T>(query: PreparedQuery): Promise<T[]> {
    await this.healthCheck();
    const client = this.client as Client;
    const { text, args } = query;

    const result = await client.queryObject<QueryObjectResult<T>>({
      text,
      args,
      camelcase: this.useNativeCamel,
    });

    return (this.useNativeCamel
      ? result
      : this.renameKeys(result)) as unknown as T[];
  }

  private renameKeys<T>(queryResult: QueryObjectResult<T>): T[] {
    const objects = [];

    for (const object of queryResult.rows) {
      const o = object as never;

      for (const key of Object.keys(o)) {
        const renamedKey = this.transformer.fromDbField(key);
        delete Object.assign(o, { [renamedKey]: o[key] })[key];
      }

      objects.push(object);
    }

    return objects;
  }

  private async healthCheck() {
    if (!this.isInitialized()) {
      await this.init();
    }
  }

  private generateTransactionName(): string {
    return crypto.randomUUID();
  }
}
