import { QueryPart, QueryText } from "./query.ts";

export class Delete extends QueryPart {
  constructor() {
    super();
  }

  toText(): QueryText {
    return { text: "DELETE" };
  }
}
