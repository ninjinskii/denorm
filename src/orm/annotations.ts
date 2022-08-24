// Ultra generic annotations, we expect weird type
// deno-lint-ignore-file

import { FieldDescription } from "../query/create.ts";

// deno-lint-ignore-file no-explicit-any
let orm: string[] = [];
let marks: Mark[] = [];

interface Mark {
  primaryKey?: { serial: boolean };
  parameterIndex: number;
  type: string;
  nullable: _;
}

// Boolean as numeric to help clarify developer intention
export enum _ {
  NULLABLE = 1,
  NOT_NULLABLE = 0,
}

export enum PrimaryKeyType {
  STRING = "VARCHAR",
  INTEGER = "INT",
}

export function initTable(instance: any, tableName: string) {
  let index = 0;

  for (const [key, value] of Object.entries(instance)) {
    defineRow(key, typeof value, index);
    index++;
  }
}

export function PrimaryKey(
  autoIncrement = true,
  type = PrimaryKeyType.INTEGER,
) {
  return function (
    _target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    marks.push({
      primaryKey: { serial: autoIncrement },
      parameterIndex,
      type,
      nullable: _.NOT_NULLABLE,
    });
  };
}

export function Varchar(
  size: number | null = null,
  nullable = _.NOT_NULLABLE,
) {
  return function (
    _target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    const type = size ? `VARCHAR(${size})` : "VARCHAR";
    marks.push({ parameterIndex, type, nullable });
  };
}

export function BigInt(nullable = _.NOT_NULLABLE) {
  return function (
    _target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    marks.push({ parameterIndex, type: "BIGINT", nullable });
  };
}

export function Int(nullable = _.NOT_NULLABLE) {
  return function (
    _target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    marks.push({ parameterIndex, type: "INT", nullable });
  };
}

export function Real(nullable = _.NOT_NULLABLE) {
  return function (
    _target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    marks.push({ parameterIndex, type: "REAL", nullable });
  };
}

export function Boolean(nullable = _.NOT_NULLABLE) {
  return function (
    _target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    marks.push({ parameterIndex, type: "BOOLEAN", nullable });
  };
}

function defineRow(
  propertyKey: string,
  type: string,
  index: number,
): FieldDescription {
  let dbType = "";
  let nullable = _.NOT_NULLABLE;
  const mark = getMarkForIndex(index);

  switch (type) {
    case "string":
      dbType = "VARCHAR";
      break;

    case "number":
      dbType = "INT";
      break;

    case "boolean":
      dbType = "BOOLEAN";
      break;

    default:
  }

  return {
    type,
    fieldName: propertyKey,
    nullable: mark ? !!mark.nullable : !!_.NOT_NULLABLE,
    primaryKey: mark ? mark.primaryKey : undefined,
    // const serial = mark.primaryKey.serial ? "SERIAL " : " ";
    // const queryPart = `${propertyKey} ${serial}PRIMARY KEY`;
    // orm.push(queryPart);
    // return;
  };

  // const notNull = nullable ? "" : " NOT NULL";
  // const queryPart = `${propertyKey} ${dbType}${notNull}`;
  // orm.push(queryPart);
}

function getMarkForIndex(index: number): Mark | undefined {
  return marks.find((mark) => mark.parameterIndex === index);
}
