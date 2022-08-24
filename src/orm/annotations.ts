// Ultra generic annotations, we expect weird type
// deno-lint-ignore-file no-explicit-any

import { Create, Field, SizeableType, Type } from "../query/create.ts";

let fields: Field[] = [];
let resetOnNextInitTable = false;

export enum Nullable {
  YES = "NULLABLE",
  NO = "NOT NULL",
}

export interface Table {
  type: any;
  name: string;
}

export function initTable(_type: any, tableName: string): Field[] {
  // We wont use the type, but we need it to be evaluated.
  // Evaluating the type will trigger model's annotations
  // without us having to provide an instance of model
  // and describing fake parameters (e.g new Wine("", "", 1, ""))
  // to comply with TS type checks

  console.log(`init table ${tableName}`);
  const copy = [...fields];
  const create = new Create(
    { toDbField: (a) => a, fromDbField: (a) => a },
    tableName,
    copy,
  );

  return copy;
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
  console.log(`process annotation ${parameterIndex}`);

  if (resetOnNextInitTable) {
    fields = [];
    resetOnNextInitTable = false;
  }

  // Black magic to get actual class property name on which this annotation was placed
  const keys = Object.keys(new target());
  const name = keys[parameterIndex];
  const length = keys.length;

  // +1: paramaterIndex starts at 0
  if (length === parameterIndex + 2) {
    // We're on the last anotation processed (the first in the model object)
    resetOnNextInitTable = true;
  }

  const primaryKey = isPrimaryKey || undefined;
  const field = { type, primaryKey, as, nullable, name, size };

  // Note that last parameters annotation's runs first
  fields.unshift(field);
}
