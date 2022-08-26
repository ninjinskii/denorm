// Ultra generic annotations, we expect weird type
// deno-lint-ignore-file no-explicit-any ban-types
import { Create, Field, SizeableType, Type } from "../query/create.ts";
import { QueryExecutor } from "../query/query-executor.ts";

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

interface TableSeparator {
  tableName: string;
}

const fields: Array<Field | TableSeparator> = [];

// Keep track of every fields that uses "as" to get correct mapping when
// grabbing values out of db.
// PS: not used if the model is not defined (no decorators)
export const aliasTracker: TableAliasTracker = {};

export async function initTables(databaseUrl: string, _types: any[]) {
  // We wont use the types, but we need them to be evaluated.
  // Evaluating the type will trigger model's annotations
  // without us having to provide an instance of model
  // and describing fake parameters (e.g new Wine("", "", 1, ""))
  // to comply with TS type checks

  console.log(fields)
  console.log(aliasTracker)

  const executor = new QueryExecutor(databaseUrl);
  await executor["init"]();

  const fieldByTable: Array<Field[]> = [];
  const tableNames: string[] = [];
  let hasPrimaryKey = true;

  for (const field of fields) {
    const name = (field as TableSeparator).tableName;
    const primaryKey = (field as Field).primaryKey;
    const table = lastOf(tableNames);

    if (primaryKey) {
      hasPrimaryKey = true;
    }

    if (name) {
      if (!hasPrimaryKey) {
        throw new Error(
          `Table "${table}" has no primary key, use @PrimaryKey on a property.`,
        );
      }

      hasPrimaryKey = false; // Switch table. So we want to look for a new PK
      tableNames.push(name);
      fieldByTable.push([]); // This empty array is a slot for next fields of this new table
    } else if (table) {
      const actualField = field as Field;
      updateAliasTracker(actualField, table);
      lastOf(fieldByTable)?.push(field as Field);
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
    const query = new Create(tableName, fields).toText();
    await executor.submitQuery(query);
  }

  await executor["client"]?.end();
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
    console.log("Running entity");
    console.warn("Running entity");
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
  const field = { type, primaryKey, as, nullable, name, size };

  // if (as) {
  //   aliasTracker[aliasTracker.length - 1][as] = name;
  // }

  // Note that last parameters annotation's runs first
  fields.unshift(field);
}
