import { QueryPart, QueryText } from "./query.ts";

export class Select extends QueryPart {
  private readonly table: string;
  private readonly projection: string[];

  constructor(table: string, ...projection: string[]) {
    super();
    this.table = table;
    this.projection = projection;

    if (projection.length === 0) {
      projection.push("*");
    }
  }

  toText(): QueryText {
    const formattedProjection = this.projection.join(", ");
    return { text: `SELECT ${formattedProjection} FROM ${this.table};` };
  }
}
