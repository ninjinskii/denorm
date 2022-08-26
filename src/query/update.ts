import { PreparedQueryText, QueryPart } from "./query.ts";

export interface UpdateInfo {
  [field: string]: unknown
}

export class Update extends QueryPart {
  private tableName: string;
  private updates: UpdateInfo;

  constructor(tableName: string, updates: UpdateInfo) {
    super();
    this.tableName = tableName;
    this.updates = updates;

    if (Object.keys(updates).length === 0) {
      throw Error("Cannot perform empty UPDATE query");
    }
  }

  toText(): PreparedQueryText {
    const start = `UPDATE ${this.tableName} SET`;
    const updateInfoText = [];
    const preparedValues = [];
    let preparedArgsCounter = 1;

    for (const field of Object.keys(this.updates)) {
      updateInfoText.push(`${field} = $${preparedArgsCounter++}`);
      preparedValues.push(this.updates[field]);
    }

    const text = `${start} ${updateInfoText.join(", ")}`;
    return { text, affectedTables: [this.tableName], args: preparedValues };
  }
}
