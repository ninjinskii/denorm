import { Create } from "./create.ts";
import { From } from "./from.ts";
import { Insert } from "./insert.ts";
import { PreparedQueryText, QueryText } from "./query.ts";
import { QueryExecutor } from "./query-executor.ts";
import { Select } from "./select.ts";
import { InternalWhereCondition, Where, WhereCondition } from "./where.ts";
import { Update, UpdateInfo } from "./update.ts";

type Agregator = "AND" | "OR";

export class QueryBuilder {
  private executor: QueryExecutor;
  private _select: Select | null = null;
  private _from: From | null = null;
  private _where: Where | null = null;
  private _whereConditions: Array<WhereCondition | WhereCondition[]> = [];
  private _agregators: Agregator[] = [];
  private _insert: Insert | null = null;
  private _create: Create | null = null;
  private _update: Update | null = null;
  private whereIsCalled = false;
  private whereArgsOffset = 0;

  constructor(databaseUrl: string) {
    this.executor = new QueryExecutor(databaseUrl);
  }

  select(...fields: string[]): QueryBuilderAfterSelect {
    this._select = new Select(...fields);
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
    this._insert = new Insert(tableName, objects);
    return this;
  }

  update(tableName: string, ...updates: UpdateInfo[]): QueryBuilderAfterUpdate {
    this._update = new Update(tableName, updates);
    this.whereArgsOffset = updates.length;
    return this;
  }

  private prepareWhere() {
    const agregators = this._agregators;
    const conditions = this._whereConditions;
    let where: Where | null = null;

    // Check if first conditions is not bounded with others (parenthesis), we settle it in constructor
    if (!Array.isArray(conditions[0])) {
      where = new Where(conditions.shift() as WhereCondition);
      where.setPreparedArgsOffset(this.whereArgsOffset);

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
      where.setPreparedArgsOffset(this.whereArgsOffset);

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
    const preparedQuery = this.toText();
    return this.executor.submitQuery(preparedQuery);
  }

  // Let the developer decide, defaulting to any in case no type is needed
  // deno-lint-ignore no-explicit-any
  async executeAndGetFirst<T = any>(): Promise<T> {
    const preparedQuery = this.toText();
    const array = await this.executor.submitQuery<T>(preparedQuery);
    return array[0];
  }

  // TODO: find a better way to chain queries
  toText(): PreparedQueryText {
    this.healthCheck();

    if (this._insert) {
      const insert = this._insert.toText();
      insert.text += ";";
      this.reset();
      return insert;
    }

    if (this._update) {
      const update = this._update.toText();
      const where = this._where?.toText();
      const text = `${update.text} ${where?.text};`;
      const mergeArgs = update.args.concat(where?.args);
      this.reset();

      return { text, args: mergeArgs };
    }

    const select = this._select?.toText();
    const from = this._from?.toText();
    const where = this._where?.toText();
    const args = this._where?.toText().args || [];
    const all = [select, from, where];
    const affectedTables = from?.affectedTables;

    const text = all.map((part) => part?.text).join(" ").trim() + ";";
    this.reset();
    return { text, args, affectedTables };
  }

  private reset() {
    this._select = null;
    this._from = null;
    this._where = null;
    this._whereConditions = [];
    this._agregators = [];
    this._insert = null;
    this._create = null;
    this._update = null;
    this.whereIsCalled = false;
    this.whereArgsOffset = 0;
  }

  // TODO: find a better way to check query health than if / else
  private healthCheck() {
    if (this._whereConditions.length) {
      this.prepareWhere();
    }

    if (!this._select && !this._insert && !this._create && !this._update) {
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

    if (
      this._create &&
      (this._select || this._from || this._where || this._insert)
    ) {
      throw new Error(
        "Cannot use create and another builder method in the same query",
      );
    }

    if (this._update && (this._select || this._from || this._insert)) {
      throw new Error(
        "Cannot use update and another builder method in the same query",
      );
    }

    if (this._update && !this._where) {
      throw new Error("update() called but not where()");
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
  toText: () => QueryText;
  execute: <T>() => Promise<T[]>;
  executeAndGetFirst: <T>() => Promise<T>;
}

interface QueryBuilderAfterWhere {
  and: (condition: WhereCondition | WhereCondition[]) => QueryBuilderAfterWhere;
  or: (condition: WhereCondition | WhereCondition[]) => QueryBuilderAfterWhere;
  toText: () => PreparedQueryText;
  execute: <T>() => Promise<T[]>;
}

interface QueryBuilderAfterInsert {
  toText: () => PreparedQueryText;
  execute: <T>() => Promise<T[]>;
}

interface QueryBuilderAfterUpdate {
  where: (condition: WhereCondition) => QueryBuilderAfterWhere;
  toText: () => PreparedQueryText;
  execute: <T>() => Promise<T[]>;
}
