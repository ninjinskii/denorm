import { Insert as InsertQuery } from "../query/insert.ts";
import { Dao } from "./dao.ts";

// TODO: add semi colon at end of query. RN its qury builder that's doing it.
// TODO: refactor SELECT, UPDATE (select should now include from, and update should require a primaryKey parameter for mass update)
// Watch global const fields: [FIelds] growing size when calling new Model()

export function Select(table: string) {
  return function (
    target: Dao,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    assertDao(target);

    descriptor.value = async (...args: string[]) => {
      const client = target.client;
      const query = `SELECT * FROM ${table}`;
      const result = await client.queryObject(query);
      return result.rows;
    };

    return descriptor;
  };
}

export function Query(query: string) {
  return function (
    target: Dao,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    assertDao(target);

    descriptor.value = async (...args: any[]) => {
      const client = target.client;
      const result = await client.queryObject({ text: query, args });
      return result.rows;
    };

    return descriptor;
  };
}

export function Insert(table: string) {
  return function (
    target: Dao,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    assertDao(target);

    descriptor.value = async (...args: any[]) => {
      const client = target.client;
      const query = new InsertQuery(table, args).toText();
      const result = await client.queryObject(query);
      return result.rows;
    };

    return descriptor;
  };
}

export function Update(table: string) {
  return function (
    target: Dao,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    assertDao(target);

    descriptor.value = async (...args: any[]) => {
      // const client = target.client;
      // const query = new UpdateRaw(table);
      // const result = await client.queryObject(query);
      // return result.rows;
    };

    return descriptor;
  };
}

function assertDao(target: Dao) {
  if (!target.client) {
    throw new Error(
      "@Select, @Insert, @Delete, @Update must be used inside a Dao class",
    );
  }
}
