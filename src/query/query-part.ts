export interface PreparedQuery {
  text: string; // Used by every statements
  args?: {
    fields?: string[]; // Fields are used for insert statements
    // deno-lint-ignore no-explicit-any
    values: any[]; // Values are used for where and insert statements
  };
}

export abstract class QueryPart {
  abstract toText(): PreparedQuery;
}
