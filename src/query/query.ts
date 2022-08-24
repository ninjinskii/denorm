export interface QueryText {
  text: string
}

export interface PreparedQueryText extends QueryText {
  // Queries args will have any type on them
  // deno-lint-ignore no-explicit-any
  args: any[];
}

export abstract class QueryPart {
  abstract toText(): QueryText;
}
