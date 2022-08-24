import { QueryText, QueryPart } from "./query.ts";

export class From extends QueryPart {
  private readonly tables: string[];

  constructor(...tables: string[]) {
    super();
    this.tables = tables;
  }

  toText(): QueryText {
    const formattedTables = this.tables.join(",");
    return { text: `FROM ${formattedTables}` };
  }
}
