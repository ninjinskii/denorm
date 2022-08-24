import { Nullable } from "../orm/annotations.ts";
import { FieldTransformer } from "./query-builder.ts";
import { PreparedQuery, QueryPart } from "./query-part.ts";

export interface Field {
  type: Type;
  name: string;
  primaryKey?: boolean;
  size?: number;
  as?: string;
  nullable?: Nullable;
}

export type Type =
  | "BIGINT"
  | "BOOL"
  | "BYTEA"
  | "CHAR"
  | "VARCHAR"
  | "DATE"
  | "FLOAT8"
  | "FLOAT4"
  | "INT"
  | "JSON"
  | "JSONB"
  | "SERIAL"
  | "SERIAL8";

export enum SizeableType {
  "VARCHAR",
  "CHAR",
}

export class Create extends QueryPart {
  private transformer: FieldTransformer | null;
  private tableName: string;
  private fields: Field[];

  constructor(
    transformer: FieldTransformer | null,
    tableName: string,
    fields: Field[],
  ) {
    super();
    this.transformer = transformer;
    this.tableName = tableName;
    this.fields = fields;

    if (this.fields.length === 0) {
      throw new Error("Create table cannot be empty");
    }
  }

  toPreparedQuery(): PreparedQuery {
    const start = `CREATE TABLE IF NOT EXISTS ${this.tableName} (`;
    const end = `);`;
    const fieldsText = [];

    for (const field of this.fields) {
      const { name, type, size, nullable, primaryKey, as } = field;
      const text = `${as || name} ${type}${size || ""} ${
        primaryKey ? "PRIMARY KEY" : ""
      } ${nullable || primaryKey ? "" : "NOT NULL"}`
        .trim();

      fieldsText.push(text);
    }

    const text = `${start}${fieldsText.join(", ")}${end}`;
    return { text };
  }
}
