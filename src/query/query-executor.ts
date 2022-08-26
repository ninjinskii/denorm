import { QueryObjectResult } from "https://deno.land/x/postgres@v0.16.1/query/query.ts";
import { Client, Transaction } from "../../deps.ts";
import { QueryText } from "./query.ts";
import { aliasTracker } from "../orm/annotations.ts";

export class QueryExecutor {
  private client: Client | null = null;
  private transaction: Transaction | null = null;
  private databaseUrl: string;
  private useNativeCamel = false;

  constructor(databaseUrl: string) {
    this.databaseUrl = databaseUrl;
  }

  private async init() {
    const client = new Client(this.databaseUrl);
    await client.connect();

    this.client = client;
  }

  isInitialized(): boolean {
    return this.client !== null;
  }

  async startTransaction() {
    const name = this.generateTransactionName();
    this.transaction = this.client?.createTransaction(name) || null;
    await this.transaction?.begin()
  }

  async endTransaction() {
    await this.transaction?.commit()
    this.transaction = null;
  }

  async submitQuery<T>(query: QueryText): Promise<T[]> {
    await this.healthCheck();
    const client = this.transaction as Transaction || this.client as Client;
    const result = await client.queryObject<QueryObjectResult<T>>({
      ...query,
      camelcase: this.useNativeCamel,
    });

    return (this.useNativeCamel
      ? result.rows
      : this.maybeRenameKeys(query, result)) as unknown as T[];
  }

  private maybeRenameKeys<T>(
    query: QueryText,
    queryResult: QueryObjectResult<T>,
  ): T[] {
    const shouldRenameKeys = Object.keys(aliasTracker).length &&
      queryResult.command === "SELECT" &&
      query.affectedTables;

    if (!shouldRenameKeys) {
      return queryResult.rows as unknown as T[];
    }

    const tables = query.affectedTables as string[];
    const objects: T[] = [];

    for (const object of queryResult.rows) {
      const o = object as never;
      const renamed = {} as never;

      for (const key of Object.keys(o)) {
        if (tables.length === 1) {
          const renamedKey = aliasTracker[tables[0]][key] || key;
          renamed[renamedKey] = o[key];
        } else if (tables.length > 1 && query.tableFields) {
          const table = query.tableFields.find((tableField) =>
            tableField.field === key
          )?.table;

          if (table) {
            const renamedKey = aliasTracker[table][key] || key;
            renamed[renamedKey] = o[key];
          }
        }
      }

      objects.push(renamed);
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
