// Client would pass us any type
// deno-lint-ignore-file no-explicit-any

import { Client } from "../../deps.ts";
import { Insert as InsertQuery } from "../query/insert.ts";
import { Select as SelectQuery } from "../query/select.ts";
import { Delete as DeleteQuery } from "../query/delete.ts";
import { Update as UpdateQuery } from "../query/update.ts";
import { Where } from "../query/where.ts";
import { fields } from "./fields.ts";
import { Dao } from "./dao.ts";
import { transaction } from "../transaction/transaction.ts";

export function Select(where?: Where) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    descriptor.value = async function (...args: string[]) {
      const client = assertClient(this);
      const table = (this as Dao).tableName;
      bindWhereParameters(args, where);
      const select = new SelectQuery(table).toText().text;
      const query = addWhere(select, where);
      const preparedArgs = where ? where.toText().args : [];
      const names = fields
        .filter((field) => field.table === table)
        .map((field) => field.name);

      console.log(query)
      console.log(fields)
      console.log(preparedArgs)

      const result = await client.queryObject({
        text: query,
        fields: names,
        args: preparedArgs,
      });

      return result.rows;
    };

    return descriptor;
  };
}

export function Query(query: string, aliases?: string[]) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    descriptor.value = async function (...args: any[]) {
      const client = assertClient(this);
      const result = await client.queryObject({
        text: query,
        args,
        fields: aliases,
      });
      return result.rows;
    };

    return descriptor;
  };
}

export function Insert() {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    descriptor.value = async function (args: any[]) {
      const client = assertClient(this);
      const table = (this as Dao).tableName;
      const query = new InsertQuery(table, args).toText();
      const result = await client.queryObject(query);
      return result.rowCount || 0; // Number of row inserted
    };

    return descriptor;
  };
}

export function Update() {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    descriptor.value = async function (...args: any[]) {
      assertClient(this);
      const table = (this as Dao).tableName;
      const { queries, groupedPreparedValues } = new UpdateQuery(table, args[0])
        .getPreparedQueries();

      let index = 0;
      let rowsUpdated = 0;

      const ok = await transaction([this as Dao], async (t) => {
        for (const query of queries) {
          const response = await t.queryObject(
            query,
            groupedPreparedValues[index++],
          );

          rowsUpdated += response.rowCount || 0;
        }
      });

      if (ok) {
        return rowsUpdated;
      } else {
        throw new Error("An unknown error happened while updating objects");
      }
    };

    return descriptor;
  };
}

export function Delete(where: Where) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    descriptor.value = async function (..._args: string[]) {
      const client = assertClient(this);
      const table = (this as Dao).tableName;
      const _delete = new DeleteQuery(table).toText().text;
      const query = addWhere(_delete, where);
      const preparedArgs = where.toText().args;

      const result = await client.queryObject({
        text: query,
        args: preparedArgs,
      });

      return result.rowCount || 0;
    };

    return descriptor;
  };
}

function assertClient(context: any): Client {
  if ((context as Dao).client) {
    return context.transaction || context.client;
  } else {
    throw new Error(
      "@Select, @Insert, @Update, @Delete, should used inside a Dao class.",
    );
  }
}

function addWhere(base: string, where?: Where) {
  if (where) {
    const noTrailingSemiColon = base.slice(0, -1);
    return `${noTrailingSemiColon} ${where.toText().text}`;
  }

  return base;
}

function bindWhereParameters(args: any[], where?: Where) {
  if (!where) {
    return;
  }

  for (const [key, value] of Object.entries(where.conditions)) {
    if (typeof value === "string" && value.match(/°[1-9]{1,2}/g)) {
      const position = parseInt(value.substring(1));
      where.conditions[key] = args[position - 1];
    }
  }
}
