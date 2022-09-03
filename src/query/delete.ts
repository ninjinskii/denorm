import { QueryPart, QueryText } from "./query.ts";

export class Delete extends QueryPart {
  private readonly table: string;

  constructor(table: string) {
    super();
    this.table = table;
  }

  toText(): QueryText {
    return { text: `DELETE FROM ${this.table}` };
  }
}
