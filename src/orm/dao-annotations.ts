import { Client } from "../../deps.ts";
import { Insert as InsertQuery } from "../query/insert.ts";
import { UpdateMass } from "../query/update-mass.ts";
import { Dao } from "./dao.ts";

export function Select(table: string) {
  return function (
    target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    descriptor.value = async function (...args: string[]) {
      const client = assertClient(this);
      const query = `SELECT * FROM ${table}`;
      const result = await client.queryObject(query);
      return result.rows;
    };

    return descriptor;
  };
}

export function Query(query: string) {
  return function (
    target: any,
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
    target: any,
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
    target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    descriptor.value = async function (...args: any[]) {
      const client = assertClient(this);
      const { queries, groupedPreparedValues } = new UpdateMass(table, args)
        .getPreparedQueries();

      const t = client.createTransaction("transaction");
      let index = 0;
      await t.begin();

      for (const query of queries) {
        await t.queryObject(query, groupedPreparedValues[index++]);
      }

      await t.commit();
    };

    return descriptor;
  };
}

function assertClient(context: any): Client {
  if ((context as Dao).client) {
    return context.client
  } else {
    throw new Error("@Select, @Insert, @Update, @Delete, should used inside a Dao class.")
  }
}
