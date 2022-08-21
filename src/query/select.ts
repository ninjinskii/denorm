import { QueryPart } from "./query-part.ts";

export class Select extends QueryPart {
  private readonly projection: string[];

  constructor(...projection: string[]) {
    super();
    this.projection = projection;
  }

  toText(): string {
    const formattedProjection = this.mapFields().join(",");
    return `SELECT ${formattedProjection}`;
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

      console.log(this.transformer);

      return this.transformer.toDbField(clientField);
    });
  }
}
