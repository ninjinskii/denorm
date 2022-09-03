// Ultra generic annotations, we expect weird type
// deno-lint-ignore-file no-explicit-any ban-types
import { Client } from "../../deps.ts";
import { Create, Field, SizeableType, Type } from "../query/create.ts";

// How does the annotation system works:
// When referencing a type, like we do in initTables(databaseUrl, Wine, Bottle),
// all annotations of every class runs.
// First, member annotations, then class annotation, then proceed to the next type.
// Each fields will be placed in `fields` array, with a placeholder on the table.
// Then, class annotation (@Entity) will look for these placeholders and replace them with the actual table name.

export enum Nullable {
  YES = "NULLABLE",
  NO = "NOT NULL",
}

interface TableAliasTracker {
  [tableName: string]: AliasTracker;
}

interface AliasTracker {
  [fieldName: string]: string;
}

export const fields: Field[] = [];

// Keep track of every fields that uses "as" to get correct mapping when
// grabbing values out of db.
// PS: not used if the model is not defined (no decorators)
export const aliasTracker: TableAliasTracker = {};

let initAlreadyCalled = false;

export async function initTables(client: Client, _types: any[]) {
  // We wont use the types, but we need them to be evaluated.
  // Evaluating the type will trigger model's annotations
  // without us having to provide an instance of model
  // and describing fake parameters (e.g new Wine("", "", 1, ""))
  // to comply with TS type checks
  if (initAlreadyCalled) {
    throw new Error("Cannot call initTables() multiple times");
  }

  await client.connect();

  const fieldByTable: Array<Field[]> = [];
  const tableNames: string[] = [];
  let hasPrimaryKey = true;

  for (const field of fields) {
    const primaryKey = field.primaryKey;
    const table = lastOf(tableNames);

    if (primaryKey) {
      hasPrimaryKey = true;
    }

    const newTable = lastOf(tableNames) !== field.table;
    if (newTable) {
      if (!hasPrimaryKey) {
        throw new Error(
          `Table "${table}" has no primary key, use @PrimaryKey on a property.`,
        );
      }

      hasPrimaryKey = false; // Switch table. So we want to look for a new PK
      tableNames.push(field.table);
      fieldByTable.push([]); // This empty array is a slot for next fields of this new table
      lastOf(fieldByTable)?.push(field);
    } else if (table) {
      updateAliasTracker(field, table);
      lastOf(fieldByTable)?.push(field);
    }
  }

  // Most likely, developer missed a class annotation
  if (
    tableNames.length !== fieldByTable.length || fieldByTable[0].length === 0
  ) {
    throw new Error(
      "Cannot create tables. Did you add @Entity to all your model classes?",
    );
  }

  for (const [index, fields] of fieldByTable.entries()) {
    const tableName = tableNames[index];
    const query = new Create(tableName, fields).toText();
    await client.queryObject(query);
  }

  initAlreadyCalled = true;
  await client.end();
}

function updateAliasTracker(field: Field, table: string) {
  if (table && field.as) {
    if (!aliasTracker[table]) {
      aliasTracker[table] = {};
    }
    aliasTracker[table][field.as] = field.name;
  }
}

export function Entity(tableName: string) {
  return function (_constructor: Function) {
    fields
      .filter((field) => field.table === "")
      .forEach((field) => field.table = tableName);
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

function lastOf<T>(array: Array<T>): T | null {
  if (array.length === 0) {
    return null;
  }

  return array[array.length - 1];
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
  const _as = as || name;
  const field = { type, primaryKey, as: _as, nullable, name, size, table: "" };

  // Note that last parameters annotation's runs first
  fields.unshift(field);
}
