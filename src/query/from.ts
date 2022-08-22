import { PreparedQuery, QueryPart } from "./query-part.ts";

export class From extends QueryPart {
  private readonly tables: string[];

  constructor(...tables: string[]) {
    super();
    this.tables = tables;
  }

  toText(): PreparedQuery {
    const formattedTables = this.tables.join(",");
    return { text: `FROM ${formattedTables}` };
  }
}
