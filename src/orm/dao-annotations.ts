// Client would pass us any type
// deno-lint-ignore-file no-explicit-any

import { Client } from "../../deps.ts";
import { Insert as InsertQuery } from "../query/insert.ts";
import { Select as SelectQuery } from "../query/select.ts";
import { Delete as DeleteQuery } from "../query/delete.ts";
import { UpdateMass } from "../query/update-mass.ts";
import { PreparedWhere, Where } from "../query/where.ts";
import { fields } from "./annotations.ts";
import { Dao } from "./dao.ts";

export function Select(table: string, where?: Where | PreparedWhere) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    descriptor.value = async function (..._args: string[]) {
      const client = assertClient(this);
      const select = new SelectQuery(table).toText().text;
      const query = addWhere(select, where);
      const preparedArgs = where ? where.toText().args : [];
      const names = fields
        .filter((field) => field.table === table)
        .map((field) => field.name);

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

export function Query(query: string) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    descriptor.value = async function (...args: any[]) {
      const client = assertClient(this);
      const result = await client.queryObject({ text: query, args });
      return result.rows;
    };

    return descriptor;
  };
}

export function Insert(table: string) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    descriptor.value = async function (args: any[]) {
      const client = assertClient(this);
      const query = new InsertQuery(table, args).toText();
      const result = await client.queryObject(query);
      return result.rowCount; // Number of row inserted
    };

    return descriptor;
  };
}

export function Update(table: string) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    descriptor.value = async function (...args: any[]) {
      const client = assertClient(this);
      const { queries, groupedPreparedValues } = new UpdateMass(table, args[0])
        .getPreparedQueries();

      const t = client.createTransaction("transaction");
      let index = 0;
      let rowsUpdated = 0;

      console.log(queries);
      await t.begin();

      for (const query of queries) {
        const response = await t.queryObject(
          query,
          groupedPreparedValues[index++],
        );

        rowsUpdated += response.rowCount || 0;
      }

      await t.commit();
      return rowsUpdated;
    };

    return descriptor;
  };
}

export function Delete(table: string, where?: Where | PreparedWhere) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    if (!where) {
      throw new Error(
        "Where without condition is too risky. If you really want to do so, use @Query('DELETE FROM <table>')",
      );
    }

    descriptor.value = async function (..._args: string[]) {
      const client = assertClient(this);
      const _delete = new DeleteQuery(table).toText().text;
      const query = addWhere(_delete, where);
      const preparedArgs = where.toText().args;

      const result = await client.queryObject({
        text: query,
        args: preparedArgs,
      });

      return result.rows;
    };

    return descriptor;
  };
}

function assertClient(context: any): Client {
  if ((context as Dao).client) {
    return context.client;
  } else {
    throw new Error(
      "@Select, @Insert, @Update, @Delete, should used inside a Dao class.",
    );
  }
}

function addWhere(base: string, where?: Where | PreparedWhere) {
  if (where) {
    const noTrailingSemiColon = base.slice(0, -1);
    return `${noTrailingSemiColon} ${where.toText().text};`;
  }

  return base;
}
