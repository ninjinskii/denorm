import { Nullable } from "../annotations/fields.ts";
import { QueryPart, QueryText } from "./query.ts";

export interface Field {
  type: Type;
  name: string;
  table: string
  as: string;
  primaryKey?: boolean;
  size?: number;
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
  private tableName: string;
  private fields: Field[];

  constructor(tableName: string, fields: Field[]) {
    super();
    this.tableName = tableName;
    this.fields = fields;

    if (this.fields.length === 0) {
      throw new Error("Create table cannot be empty");
    }
  }

  toText(): QueryText {
    const start = `CREATE TABLE IF NOT EXISTS ${this.tableName} (`;
    const end = `);`;
    const fieldsText = [];

    for (const field of this.fields) {
      const { name, type, size, nullable, primaryKey, as } = field;
      const pk = primaryKey ? "PRIMARY KEY" : "";
      const nul = nullable || primaryKey ? "" : "NOT NULL";
      const t = size ? `${type}(${size})` : type;
      const text = [as || name, t, pk, nul].filter((text) => text !== "")
        .join(" ");

      fieldsText.push(text);
    }
    const text = `${start}${fieldsText.join(", ")}${end}`;
    return { text };
  }
}
