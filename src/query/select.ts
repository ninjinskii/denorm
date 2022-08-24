import { QueryPart, QueryText } from "./query.ts";
import { FieldTransformer } from "./query-builder.ts";

export class Select extends QueryPart {
  private readonly projection: string[];
  private transformer: FieldTransformer | null;

  constructor(transformer: FieldTransformer | null, ...projection: string[]) {
    super();
    this.projection = projection;
    this.transformer = transformer;
  }

  toText(): QueryText {
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

      return this.transformer?.toDbField(clientField) || clientField;
    });
  }
}
