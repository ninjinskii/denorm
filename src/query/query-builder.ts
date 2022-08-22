import { From } from "./from.ts";
import { Insert } from "./insert.ts";
import { QueryExecutor } from "./query-executor.ts";
import { PreparedQuery } from "./query-part.ts";
import { Select } from "./select.ts";
import { InternalWhereCondition, Where, WhereCondition } from "./where.ts";

export interface FieldTransformer {
  toDbField: (clientName: string) => string;
  fromDbField: (fieldName: string) => string;
  usePostgresNativeCamel?: boolean;
}

type Agregator = "AND" | "OR";

export class QueryBuilder {
  private transformer: FieldTransformer | null;
  private executor: QueryExecutor;
  private _select: Select | null = null;
  private _from: From | null = null;
  private _where: Where | null = null;
  private _whereConditions: Array<WhereCondition | WhereCondition[]> = [];
  private _agregators: Agregator[] = [];
  private _insert: Insert | null = null;
  private whereIsCalled = false;

  constructor(transformer: FieldTransformer | null, databaseUrl: string) {
    this.transformer = transformer;
    this.executor = new QueryExecutor(databaseUrl, this.transformer);
  }

  select(...fields: string[]): QueryBuilderAfterSelect {
    this._select = new Select(this.transformer, ...fields);
    return this;
  }

  from(...tables: string[]): QueryBuilderAfterFrom {
    this._from = new From(...tables);
    return this;
  }

  where(condition: WhereCondition): QueryBuilderAfterWhere {
    this.whereIsCalled = true;
    this._whereConditions.push(condition);
    return this;
  }

  and(condition: WhereCondition | WhereCondition[]): QueryBuilderAfterWhere {
    this.throwIfNotWhere();
    this._agregators.push("AND");
    this._whereConditions.push(condition);
    return this;
  }

  or(condition: WhereCondition | WhereCondition[]): QueryBuilderAfterWhere {
    this.throwIfNotWhere();
    this._agregators.push("OR");
    this._whereConditions.push(condition);
    return this;
  }

  // We can't guess the type
  // deno-lint-ignore no-explicit-any
  insert(tableName: string, objects: any[]): QueryBuilderAfterInsert {
    this._insert = new Insert(this.transformer, tableName, objects);
    return this;
  }

  private prepareWhere() {
    const agregators = this._agregators;
    const conditions = this._whereConditions;
    let where: Where | null = null;

    // Check if first conditions is not bounded with others (parenthesis), we settle it in constructor
    if (!Array.isArray(conditions[0])) {
      where = new Where(this.transformer, conditions.shift() as WhereCondition);

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
      where = new Where(this.transformer);

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

  // Let the developer decide, defaulting to any in case no type is needed
  // deno-lint-ignore no-explicit-any
  execute<T = any>(): Promise<T[]> {
    const preparedQuery = this.getPreparedQuery();
    return this.executor.submitQuery(preparedQuery);
  }

  // Let the developer decide, defaulting to any in case no type is needed
  // deno-lint-ignore no-explicit-any
  async executeAndGetFirst<T = any>(): Promise<T> {
    const preparedQuery = this.getPreparedQuery();
    const array = await this.executor.submitQuery<T>(preparedQuery);
    return array[0];
  }

  getPreparedQuery(): PreparedQuery {
    this.healthCheck();

    if (this._insert) {
      const insert = this._insert.toPreparedQuery();
      insert.text += ";";
      this.reset();
      return insert;
    }

    const select = this._select?.toPreparedQuery();
    const from = this._from?.toPreparedQuery();
    const where = this._where?.toPreparedQuery();
    const args = this._where?.toPreparedQuery().args;
    const all = [select, from, where];

    const text = all.map((part) => part?.text).join(" ").trim() + ";";
    this.reset();
    return { text, args };
  }

  private reset() {
    this._select = null;
    this._from = null;
    this._where = null;
    this._whereConditions = [];
    this._agregators = [];
    this._insert = null;
    this.whereIsCalled = false;
  }

  private healthCheck() {
    if (this._whereConditions.length) {
      this.prepareWhere();
    }

    if (!this._select && !this._insert) {
      throw new Error("Empty query");
    }

    if (this._select && !this._from) {
      throw new Error("select() called but not from()");
    }

    if (this._insert && (this._select || this._from || this._where)) {
      throw new Error(
        "Cannot use insert and another builder method in the same query",
      );
    }
  }

  private throwIfNotWhere() {
    if (!this.whereIsCalled) {
      throw new Error(
        "where() has not been called yet, you can't use and() & or()",
      );
    }
  }
}

// A bunch of interfaces to guide developers while making queries
interface QueryBuilderAfterSelect {
  from: (...tables: string[]) => QueryBuilderAfterFrom;
}

interface QueryBuilderAfterFrom {
  where: (condition: WhereCondition) => QueryBuilderAfterWhere;
  getPreparedQuery: () => PreparedQuery;
  execute: <T>() => Promise<T[]>;
  executeAndGetFirst: <T>() => Promise<T>;
}

interface QueryBuilderAfterWhere {
  and: (condition: WhereCondition | WhereCondition[]) => QueryBuilderAfterWhere;
  or: (condition: WhereCondition | WhereCondition[]) => QueryBuilderAfterWhere;
  getPreparedQuery: () => PreparedQuery;
  execute: <T>() => Promise<T[]>;
}

interface QueryBuilderAfterInsert {
  getPreparedQuery: () => PreparedQuery;
  execute: <T>() => Promise<T[]>;
}
