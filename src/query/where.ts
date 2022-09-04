// The value can be of whatever type
// deno-lint-ignore-file no-explicit-any
import { PreparedQueryText, QueryPart } from "./query.ts";

export interface WhereCondition {
  [field: string]: any;
}

export class Where extends QueryPart {
  public conditions: WhereCondition;
  private readonly or?: boolean;

  constructor(conditions: WhereCondition, or?: boolean) {
    super();
    this.conditions = conditions;
    this.or = or || false;
  }

  toText(): PreparedQueryText {
    const actualCondition = [];
    const fields = Object.keys(this.conditions);
    const args = Object.values(this.conditions);
    let text = `WHERE `;
    let preparedArgsIndex = 1;

    for (const field of fields) {
      actualCondition.push(`${field} = $${preparedArgsIndex++}`);
    }

    text += actualCondition.join(this.or ? " OR " : " AND ").concat(";");
    return { text, args };
  }
}
