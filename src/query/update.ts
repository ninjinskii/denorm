// We will work a lot with any since we're trying to be as generic as possible to update anything in the db.
// deno-lint-ignore-file no-explicit-any

import { PreparedQueryText, QueryPart } from "./query.ts";

export interface UpdateInfo {
  field: string;
  value: any;
}

export class Update extends QueryPart {
  private tableName: string;
  private updates: UpdateInfo[];

  constructor(tableName: string, updates: UpdateInfo[]) {
    super();
    this.tableName = tableName;
    this.updates = updates;

    if (updates.length === 0) {
      throw Error("Cannot perform empty UPDATE query");
    }
  }

  toText(): PreparedQueryText {
    const start = `UPDATE ${this.tableName} SET`;
    const updateInfoText = [];
    const preparedValues = [];
    let preparedArgsCounter = 1;

    for (const updateInfo of this.updates) {
      updateInfoText.push(`${updateInfo.field} = $${preparedArgsCounter++}`);
      preparedValues.push(updateInfo.value);
    }

    const text = `${start} ${updateInfoText.join(", ")}`;
    return { text, affectedTables: [this.tableName], args: preparedValues };
  }
}
