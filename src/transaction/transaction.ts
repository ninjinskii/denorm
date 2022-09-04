import { Client, Transaction } from "../../deps.ts";
import { Dao } from "../orm/dao.ts";

export async function transaction(
  daos: Dao[],
  block: (t: Transaction) => Promise<void>,
): Promise<boolean> {
  if (daos.length === 0) {
    throw new Error("Daos paramerter cannot be empty.");
  }

  const name = generateTransactionName();
  const client = daos[0].client as Client;
  const transaction = client.createTransaction(name);
  let ok = true;

  for (const dao of daos) {
    dao.onTransaction(transaction);
  }

  try {
    await transaction.begin();
    await block(transaction);
  } catch (_error) {
    console.log(_error);
    ok = false;
  } finally {
    await transaction.commit();

    for (const dao of daos) {
      dao.onTransactionEnd();
    }
  }

  return ok;
}

function generateTransactionName(): string {
  return crypto.randomUUID();
}
