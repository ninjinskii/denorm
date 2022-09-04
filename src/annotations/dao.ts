import { Client, Transaction } from "../../deps.ts";

export class Dao {
  public transaction: Transaction | null = null;

  public constructor(public client: Client | Transaction) {
  }

  onTransaction(t: Transaction) {
    this.transaction = t;
  }

  onTransactionEnd() {
    this.transaction = null;
  }
}
