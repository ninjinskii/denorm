import { Client, Transaction } from "../../deps.ts";

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

  async submitQuery<T>(query: string): Promise<T[]> {
    await this.healthCheck()
  }
  
  async submitPreparedQuery(query: string, values: any[]) {
    await this.healthCheck()
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
