import { FieldTransformer } from "./query-builder.ts";
import { PreparedQuery, QueryPart } from "./query-part.ts";

export class Select extends QueryPart {
  private readonly projection: string[];
  private transformer: FieldTransformer;

  constructor(transformer: FieldTransformer, ...projection: string[]) {
    super();
    this.projection = projection;
    this.transformer = transformer;
  }

  toPreparedQuery(): PreparedQuery {
    const formattedProjection = this.mapFields().join(",");
    return { text: `SELECT ${formattedProjection}` };
  }

  private mapFields(): string[] {
    return this.projection.map((clientField) => {
      // Classic SELECT * here
      if (this.projection.length === 1 && clientField === "*") {
        return "*";
      }

      if (this.projection.length > 1 && clientField === "*") {
        throw new Error("Invalid request");
      }

      return this.transformer.toDbField(clientField);
    });
  }
}
