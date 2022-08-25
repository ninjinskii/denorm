import { QueryObjectResult } from "https://deno.land/x/postgres@v0.16.1/query/query.ts";
import { Client, Transaction } from "../../deps.ts";
import { QueryText } from "./query.ts";
import { FieldTransformer } from "./query-builder.ts";
import { aliasTracker } from "../orm/annotations.ts";

export class QueryExecutor {
  private client: Client | null = null;
  private transaction: Transaction | null = null;
  private databaseUrl: string;
  private transformer: FieldTransformer | null;
  private useNativeCamel = false;

  constructor(databaseUrl: string, transformer: FieldTransformer | null) {
    this.databaseUrl = databaseUrl;
    this.transformer = transformer;

    if (this.transformer?.usePostgresNativeCamel) {
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

  async submitQuery<T>(
    query: QueryText,
    affectedTables?: string[],
  ): Promise<T[]> {
    await this.healthCheck();
    const client = this.client as Client;
    const result = await client.queryObject<QueryObjectResult<T>>({
      ...query,
      camelcase: this.useNativeCamel,
    });

    console.log(result);

    return (this.useNativeCamel
      ? result.rows
      : this.maybeRenameKeys(result)) as unknown as T[];
  }

  private maybeRenameKeys<T>(
    queryResult: QueryObjectResult<T>,
    affectedTables?: string[],
  ): T[] {
    const shouldRenameKeys = Object.keys(aliasTracker).length &&
      queryResult.command === "SELECT" &&
      affectedTables;

    if (!shouldRenameKeys) {
      return queryResult as unknown as T[];
    }

    const objects = [];

    for (const object of queryResult.rows) {
      const o = object as never;

      for (const key of Object.keys(o)) {
        // TODO: get tables from select queries
        const renamedKey = aliasTracker["table"][key];
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
