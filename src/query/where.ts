// The value can be of whatever type
// deno-lint-ignore-file no-explicit-any

import { PreparedQueryText, QueryPart } from "./query.ts";

export interface WhereCondition {
  [field: string]: any;
  or?: boolean;
}

export class Where extends QueryPart {
  private conditions: WhereCondition;

  constructor(conditions: WhereCondition) {
    super();
    this.conditions = conditions;
  }

  // We'll return a prepared query anyway for simple of use purpose
  toText(): PreparedQueryText {
    const actualCondition = [];
    const or = this.conditions.or;
    let text = `WHERE `;

    // Will polute arg generation
    delete this.conditions.or;

    for (const [key, value] of Object.entries(this.conditions)) {
      const val = isNaN(value as any) ? `'${value}'` : value;
      actualCondition.push(`${key} = ${val}`);
    }

    text += actualCondition.join(or ? " OR " : " AND ").concat(";");
    return { text, args: [] };
  }

  setPreparedArgOffset(_offset: number) {
    // Do nothing
  }
}

export class PreparedWhere extends QueryPart {
  private readonly fields: string[];
  private readonly args: any[];
  private readonly or?: boolean;
  private preparedArgOffset = 0;

  constructor(fields: string[], args: any[], or?: boolean) {
    super();
    this.fields = fields;
    this.args = args;
    this.or = or;
  }

  setPreparedArgOffset(offset: number) {
    this.preparedArgOffset = offset;
  }

  toText(): PreparedQueryText {
    const actualCondition = [];
    let text = `WHERE `;
    let preparedArgsIndex = 1 + this.preparedArgOffset;

    for (const field of this.fields) {
      actualCondition.push(`${field} = $${preparedArgsIndex++}`);
    }

    text += actualCondition.join(this.or ? " OR " : " AND ").concat(";");
    return { text, args: this.args };
  }
}
