// Ultra generic annotations, we expect weird type
// deno-lint-ignore-file

import { Create, Field, SizeableType, Type } from "../query/create.ts";

// deno-lint-ignore-file no-explicit-any
let fields: Field[] = [];

export enum Nullable {
  YES = "NULLABLE",
  NO = "NOT NULL",
}

export interface Table {
  type: any;
  name: string;
}

export function initTable(_type: any, tableName: string) {
  // We wont use the type, but we need it to be evaluated.
  // Evaluating the type will trigger model's annotations
  // without us having to provide an instance of model
  // and describing fake parameters (e.g new Wine("", "", 1, ""))
  // to comply with TS type checks

  const create = new Create(
    { toDbField: (a) => a, fromDbField: (a) => a },
    tableName,
    fields,
  );

  console.log(`initTable ${tableName}:`);
  console.log(fields);
  console.log(create.toPreparedQuery().text);
  // We might reset array here instead of in annotation functions
  fields = [];
}

export function Field(
  type: Type,
  nullable?: Nullable,
  as?: string,
) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    // maybeResetFieldArray(target, parameterIndex);

    // Black magic to get actual class property name on which this annotation was placed
    const name = Object.keys(new target())[parameterIndex];

    // Note that last parameters annotation's runs first
    fields.unshift({ type, primaryKey: false, as, nullable, name });

    log(parameterIndex);
  };
}

export function SizedField(
  type: Type,
  size?: number,
  nullable?: Nullable,
  as?: string,
) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    // maybeResetFieldArray(target, parameterIndex);

    let s = size;

    if (type! in SizeableType) {
      s = undefined;
    }

    // Black magic to get actual class property name on which this annotation was placed
    const name = Object.keys(new target())[parameterIndex];

    // Note that last parameters annotation's runs first
    fields.unshift({ type, size: s, primaryKey: false, as, nullable, name });
    log(parameterIndex);
  };
}

export function PrimaryKey(type: Type, as?: string) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    // maybeResetFieldArray(target, parameterIndex);

    // Black magic to get actual class property name on which this annotation was placed
    const name = Object.keys(new target())[parameterIndex];

    // Note that last parameters annotation's runs first
    fields.unshift({
      type,
      primaryKey: true,
      as,
      nullable: Nullable.NO,
      name,
    });
    log(parameterIndex);
  };
}

function log(parameterIndex: number) {
  console.log(`Processing annotation ${parameterIndex}`);
}

function maybeResetFieldArray(target: any, parameterIndex: number) {
  const fieldsCount = Object.keys(target).length;

  if (parameterIndex === fieldsCount - 1) {
    fields = Array(fieldsCount);
  }
}
