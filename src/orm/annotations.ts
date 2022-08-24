// Ultra generic annotations, we expect weird type
// deno-lint-ignore-file

import { Create, Field, SizeableType, Type } from "../query/create.ts";

// deno-lint-ignore-file no-explicit-any
let fields: Field[] = [];

export enum Nullable {
  YES = "NULLABLE",
  NO = "NOT NULL",
}

// We don't use _instance and that's normal. An instace of each model classe needs to be
// instantiated so we get our annotations running.
export function initTable(_instance: any, tableName: string) {
  const create = new Create(
    { toDbField: (a) => a, fromDbField: (a) => a },
    tableName,
    fields,
  );
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
    maybeResetFieldArray(target, parameterIndex);

    console.log("parameterIndex");
    console.log(parameterIndex);
    // Note that last parameters annotation's runs first
    fields.unshift({ type, primaryKey: false, as, nullable });
  };
}

export function SizedField(
  type: Type,
  nullable?: Nullable,
  size?: number,
  as?: string,
) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    maybeResetFieldArray(target, parameterIndex);

    let s = size;

    if (type! in SizeableType) {
      s = undefined;
    }
    console.log("parameterIndex");
    console.log(parameterIndex);

    // Note that last parameters annotation's runs first
    fields.unshift({ type, size: s, primaryKey: false, as, nullable });
  };
}

export function PrimaryKey(type: Type, as?: string) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    maybeResetFieldArray(target, parameterIndex);

    console.log("parameterIndex");
    console.log(parameterIndex);
    // Note that last parameters annotation's runs first
    fields.unshift({
      type,
      primaryKey: true,
      as,
      nullable: Nullable.NO,
    });
  };
}

function maybeResetFieldArray(target: any, parameterIndex: number) {
  const fieldsCount = Object.keys(target).length;

  if (parameterIndex === fieldsCount - 1) {
    fields = Array(fieldsCount);
  }
}
