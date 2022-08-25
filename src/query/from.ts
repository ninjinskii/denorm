import { QueryPart, QueryText, TableSelector } from "./query.ts";

export class From extends QueryPart implements TableSelector {
  private readonly tables: string[];

  constructor(...tables: string[]) {
    super();
    this.tables = tables;
  }

  toText(): QueryText {
    const formattedTables = this.tables.join(", ");
    return { text: `FROM ${formattedTables}` };
  }

  getAffectedTables(): string[] {
    return this.tables;
  }
}
