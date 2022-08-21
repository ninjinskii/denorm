import { FieldTransformer, QueryPart } from "./query-part.ts";

export class Insert extends QueryPart {
  private transformer: FieldTransformer;

  constructor(transformer: FieldTransformer) {
    super();
    this.transformer = transformer;
  }

  toText(): string {
  }

  escapeFinalUserData() {
  }
}
