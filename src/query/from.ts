import { QueryPart } from "./query-part.ts";

export class From extends QueryPart {
  private readonly tables: string[];

  constructor(...tables: string[]) {
    super();
    this.tables = tables;
  }

  toText(): string {
    const formattedTables = this.tables.join(",");
    return `FROM ${formattedTables}`;
  }
}