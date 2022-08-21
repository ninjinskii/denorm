// add semi colon to all queries
// create the mapper and pass it to query parts
// demander un transformer: un objet avec deux fonctions: une pour créer le mapper client -> db et une pour le db->client

import { From } from "./from.ts";
import { FieldTransformer, QueryPart } from "./query-part.ts";
import { Select } from "./select.ts";
import { InternalWhereCondition, Where, WhereCondition } from "./where.ts";

// Maps client field name to db field name
export interface ClientFieldMapper {
  [clientField: string]: string;
}

export interface DbFieldMapper {
  [dbField: string]: string;
}

type Agregator = "AND" | "OR";

export class QueryBuilder {
  private transformer: FieldTransformer;
  private _select: Select | null = null;
  private _from: From | null = null;
  private _where: Where | null = null;
  private _whereConditions: Array<WhereCondition | WhereCondition[]> = [];
  private _agregators: Agregator[] = [];
  private whereIsCalled = false;

  // For test purposes
  private parts: QueryPart[] = [];

  constructor(transformer: FieldTransformer) {
    this.transformer = transformer;
  }

  select(...fields: string[]): QueryBuilder {
    const dbFields = fields.map((f) => this.transformer.toDbField(f));
    this._select = new Select(...dbFields);
    return this;
  }

  from(...tables: string[]): QueryBuilder {
    this._from = new From(...tables);
    return this;
  }

  where(condition: WhereCondition): QueryBuilder {
    const dbField = this.transformer.toDbField(condition.field);
    const cond = { ...condition, field: dbField };
    this._whereConditions.push(cond);
    return this;
  }

  and(condition: WhereCondition | WhereCondition[]) {
    this.throwIfNotWhere();
    this._agregators.push("AND");
    this._whereConditions.push(condition);
  }

  or(condition: WhereCondition | WhereCondition[]) {
    this.throwIfNotWhere();
    this._agregators.push("OR");
    this._whereConditions.push(condition);
  }

  // For test puposes
  private combineAll(...parts: QueryPart[]): QueryBuilder {
    // Does not work
    // this.parts.forEach((part) => {
    //   part.setTransformer(this.transformer);
    // });
    this.parts.push(...parts);
    return this;
  }

  private prepareWhere() {
    const agregators = this._agregators;
    const conditions = this._whereConditions;
    let where: Where | null = null;

    // Check if first conditions is not bounded with others (parenthesis), we settle it in constructor
    if (!Array.isArray(conditions[0])) {
      where = new Where(conditions.shift() as WhereCondition);

      for (const agregator of agregators) {
        if (agregator === "AND") {
          where.and(
            conditions.shift() as
              | InternalWhereCondition
              | InternalWhereCondition[],
          );
        }

        if (agregator === "OR") {
          where.or(
            conditions.shift() as
              | InternalWhereCondition
              | InternalWhereCondition[],
          );
        }
      }
    } else {
      where = new Where();

      // If this bug: we might need to reverse treatment of agregator and conditions
      for (const agregator of agregators) {
        if (agregator === "AND") {
          where.and(
            conditions.shift() as
              | InternalWhereCondition
              | InternalWhereCondition[],
          );
        }

        if (agregator === "OR") {
          where.or(
            conditions.shift() as
              | InternalWhereCondition
              | InternalWhereCondition[],
          );
        }
      }
    }

    this._where = where;
  }

  // For test purposes
  private terminateTest() {
    this.parts.map((part) => part.toText()).join(" ") + ";";
  }

  terminate() {
    this.prepareWhere();
    const parts = [this._select, this._from, this._where];
    const fullQuery = parts.map((part) => part?.toText()).join(" ") + ";";
    this.reset();
    return fullQuery;
  }

  private reset() {
    this._select = null;
    this._from = null;
    this._where = null;
    this._whereConditions = [];
    this._agregators = [];
    this.whereIsCalled = false;
  }

  private throwIfNotWhere() {
    if (!this.whereIsCalled) {
      throw new Error(
        "where() has not been called yet, you can't use and() & or()",
      );
    }
  }
}
