import { QueryPart, QueryText } from "./query.ts";

export class Select extends QueryPart {
  private readonly projection: string[];

  constructor(...projection: string[]) {
    super();
    this.projection = projection;
  }

  toText(): QueryText {
    const formattedProjection = this.projection.join(", ");
    const tableFields = [];

    for (const field of this.projection) {
      if (field.includes(".")) {
        const [table, fieldName] = field.split(".");
        tableFields.push({ table, field: fieldName });
      }
    }

    return { text: `SELECT ${formattedProjection}`, tableFields };
  }
}
