export interface QueryText {
  text: string;
  affectedTables?: string[];
  tableFields?: TableField[]; // Helps query executor to know which table to lokup for fields name mappings
}

export interface TableField {
  table: string;
  field: string;
}

export interface PreparedQueryText extends QueryText {
  // Queries args will have any type on them
  // deno-lint-ignore no-explicit-any
  args: any[];
}

export interface TableSelector {
  getAffectedTables(): string[];
}

export abstract class QueryPart {
  abstract toText(): QueryText;
}
