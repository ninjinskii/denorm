// Ultra generic annotations, we expect weird type
// deno-lint-ignore-file no-explicit-any ban-types

import { Query } from "https://deno.land/x/postgres@v0.16.1/query/query.ts";
import { Create, Field, SizeableType, Type } from "../query/create.ts";
import { QueryExecutor } from "../query/query-executor.ts";

const fields: Array<Field | TableSeparator> = [];

export enum Nullable {
  YES = "NULLABLE",
  NO = "NOT NULL",
}

interface TableSeparator {
  tableName: string;
}

export function initTables(databaseUrl: string, _types: any[]) {
  // We wont use the types, but we need them to be evaluated.
  // Evaluating the type will trigger model's annotations
  // without us having to provide an instance of model
  // and describing fake parameters (e.g new Wine("", "", 1, ""))
  // to comply with TS type checks

  const executor = new QueryExecutor(databaseUrl, null);
  const fieldByTable: Array<Field[]> = [];
  const tableNames: string[] = [];

  for (const field of fields) {
    const name = (field as TableSeparator).tableName;

    if (name) {
      tableNames.push(name);
      fieldByTable.push([]); // This empty array is a slot for next fields of this new table
    } else {
      fieldByTable[fieldByTable.length - 1].push(field as Field);
    }
  }

  // Most likely, developer missed a class annotation
  if (tableNames.length !== fieldByTable.length) {
    throw new Error(
      "Cannot create tables. Did you add @Entity to all your model classes?",
    );
  }

  for (const [index, fields] of fieldByTable.entries()) {
    const tableName = tableNames[index];
    const query = new Create(
      { toDbField: (a) => a, fromDbField: (a) => a },
      tableName,
      fields,
    ).toPreparedQuery();

    executor.submitQuery(query);
  }
}

export function Entity(tableName: string) {
  return function (_constructor: Function) {
    fields.unshift({ tableName });
  };
}

export function Field(
  type: Type,
  nullable?: Nullable,
  as?: string,
) {
  return function (
    target: any,
    _propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    processAnnotation(target, parameterIndex, type, false, nullable, as);
  };
}

export function SizedField(
  type: Type,
  size: number,
  nullable?: Nullable,
  as?: string,
) {
  return function (
    target: any,
    _propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    if (!(type in SizeableType)) {
      throw new Error(
        `The type ${type} cannot have a size. Use @Field() instead.`,
      );
    }

    processAnnotation(target, parameterIndex, type, false, nullable, as, size);
  };
}

export function PrimaryKey(type: Type, as?: string) {
  return function (
    target: any,
    _propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    processAnnotation(target, parameterIndex, type, true, Nullable.NO, as);
  };
}

function processAnnotation(
  target: any,
  parameterIndex: number,
  type: Type,
  isPrimaryKey: boolean,
  nullable?: Nullable,
  as?: string,
  size?: number,
) {
  // Black magic to get actual class property name on which this annotation was placed
  const name = Object.keys(new target())[parameterIndex];

  const primaryKey = isPrimaryKey || undefined;
  const field = { type, primaryKey, as, nullable, name, size };

  // Note that last parameters annotation's runs first
  fields.unshift(field);
}
