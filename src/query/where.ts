// The value can be of whatever type
// deno-lint-ignore-file no-explicit-any

import { PreparedQueryText, QueryPart } from "./query.ts";

export interface WhereCondition {
  [field: string]: any;
  or?: boolean;
}

export class Where extends QueryPart {
  private conditions: WhereCondition;
  private args: any[];
  private prepared = false;

  constructor(conditions: WhereCondition, ...preparedArgs: any[]) {
    super();
    this.conditions = conditions;
    this.args = preparedArgs;

    if (preparedArgs.length > 0) {
      this.prepared = true;
    }
  }

  toText(): PreparedQueryText {
    const actualCondition = [];
    let text = `WHERE `;
    let preparedArgsIndex = 1;

    for (const [key, value] of Object.entries(this.conditions)) {
      const val = this.prepared
        ? `$${preparedArgsIndex++}`
        : isNaN(value as any)
        ? `'${value}'`
        : value;

      actualCondition.push(`${key} = ${val}`);
    }

    text += actualCondition.join(this.conditions.or ? " OR " : " AND ").concat(
      ";",
    );

    return { text, args: this.args };
  }
}
