import { QueryObjectResult } from "https://deno.land/x/postgres@v0.16.1/query/query.ts";
import { Client, Transaction } from "../../deps.ts";
import { PreparedQuery } from "./query-part.ts";

export class QueryExecutor {
  private client: Client | null = null;
  private transaction: Transaction | null = null;
  private databaseUrl: string;

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

  async submitQuery<T>(query: PreparedQuery): Promise<T[]> {
    await this.healthCheck();
    const client = this.client as Client

    if (query.args) {
      const result = await client.queryObject<QueryObjectResult<T>>({
        text: query.text,
        args: query.args,
      });
      return result.rows as unknown as T[];
    } else {
      const result = await client.queryObject<QueryObjectResult<T>>(query.text);
      return result.rows as unknown as T[];
    }
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
