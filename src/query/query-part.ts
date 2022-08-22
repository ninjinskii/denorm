export interface PreparedQuery {
  text: string; // Used by every statements
  // deno-lint-ignore no-explicit-any
  args?: any[];
}

export abstract class QueryPart {
  abstract toPreparedQuery(): PreparedQuery;
}
