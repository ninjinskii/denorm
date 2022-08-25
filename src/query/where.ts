import { PreparedQueryText, QueryPart } from "./query.ts";

export interface WhereCondition {
  field: string;
  equals?: number | string | boolean;
  sup?: number;
  inf?: number;
  like?: string;
}

// Replace like, supe, inf with an enum named operator, & and & or by an enum named agregator
export interface InternalWhereCondition {
  field: string;
  equals?: number | string | boolean;
  sup?: number;
  inf?: number;
  like?: string;
  and?: boolean;
  or?: boolean;
  chain?: boolean;
}

export class Where extends QueryPart {
  private conditions: WhereCondition[] = [];
  private combinedOnly = false;
  private argsOffset = 0;

  constructor(condition?: WhereCondition) {
    super();

    if (condition) {
      this.conditions.push(condition);
    } else {
      this.combinedOnly = true;
    }
  }

  setPreparedArgsOffset(offset: number) {
    this.argsOffset = offset;
  }

  toText(): PreparedQueryText {
    const args = [];
    let text = "WHERE ";
    let inChain = false;
    let firstLoop = true;
    let preparedArgsCounter = 1 + this.argsOffset;

    for (const condition of this.conditions as InternalWhereCondition[]) {
      let operator = "";
      let value: unknown = "";
      let agregator = "";

      if (condition.equals !== undefined) {
        operator = "=";
        value = condition.equals;
      } else if (condition.sup !== undefined) {
        operator = ">";
        value = condition.sup;
      } else if (condition.inf !== undefined) {
        operator = "<";
        value = condition.inf;
      } else if (condition.like !== undefined) {
        operator = "LIKE";
        value = condition.like;
      }

      const chainBeginning = inChain === false && condition.chain;
      const chainEnd = inChain === true && !condition.chain;
      const maybeOpenChain = chainBeginning ? "(" : "";
      const maybeCloseChain = chainEnd ? ") " : "";

      inChain = condition.chain || false;

      if (condition.and && !(firstLoop && this.combinedOnly)) {
        agregator = "AND";
        text += " ";
      } else if (condition.or) {
        agregator = "OR";
        text += " ";
      } else {
        agregator = "";
      }

      text +=
        `${agregator} ${maybeOpenChain}${condition.field} ${operator} $${preparedArgsCounter++}${maybeCloseChain}`
          .trim();

      args.push(value);
      firstLoop = false;
    }

    return { text, args };
  }

  private aggregate(
    and: boolean,
    condition: InternalWhereCondition | InternalWhereCondition[],
  ) {
    if (Array.isArray(condition)) {
      if (condition.length === 0) {
        return;
      }

      // Set chain to true on all conditions except last one
      const last = condition.pop() as InternalWhereCondition;
      last.and = and;
      last.or = !and;

      condition.forEach((cond) => {
        cond.chain = true;
        cond.and = and;
        cond.or = !and;
      });
      condition.push(last);
      this.conditions.push(...condition);
    } else {
      condition.and = and;
      condition.or = !and;
      this.conditions.push(condition);
    }
  }

  and(condition: InternalWhereCondition | InternalWhereCondition[]) {
    this.aggregate(true, condition);
    return this;
  }

  or(condition: InternalWhereCondition | InternalWhereCondition[]) {
    this.aggregate(false, condition);
    return this;
  }
}
