import { assertEquals } from "https://deno.land/std@0.141.0/testing/asserts.ts";
import { FieldTransformer, QueryBuilder } from "../src/query/query-builder.ts";
import { snakeCase } from "../src/util/case.ts";

const transformer: FieldTransformer = {
  toDbField: (clientField) => snakeCase(clientField),
  fromDbField: (dbField) => dbField,
  usePostgresNativeCamel: true,
};

const builder = new QueryBuilder(
  transformer,
  Deno.env.get("DATABASE_URL") || "",
);

Deno.test("Insert single values, first result only", async () => {
  await withDatabase(async () => {
    await builder
      .insert("test", [
        { wine_id: 1, comment: "Hi mom!" },
      ])
      .execute();

    const actual = await builder
      .select("*")
      .from("test")
      .executeAndGetFirst();

    assertEquals(actual, { wineId: 1, comment: "Hi mom!" });
  });
});

Deno.test("Insert multiple values", async () => {
  await withDatabase(async () => {
    await builder
      .insert("test", [
        { wine_id: 1, comment: "Hi mom!" },
        { wine_id: 2, comment: `A 'weird" one '' héhé` },
      ])
      .execute();

    const actual = await builder
      .select("*")
      .from("test")
      .execute();

    assertEquals(actual, [
      { wineId: 1, comment: "Hi mom!" },
      { wineId: 2, comment: `A 'weird" one '' héhé` },
    ]);
  });
});

Deno.test("Select, but on multiple tables", async () => {
  await withDatabase(async () => {
    await builder
      .insert("test", [{ wine_id: 1, comment: "Hi mom!" }])
      .execute();

    await builder
      .insert("test_2", [{ bottle_id: 1, bottle_size: "Large" }])
      .execute();

    const actual = await builder
      .select("test_2.bottle_size", "test.comment")
      .from("test", "test_2")
      .execute();

    assertEquals(actual, [ { bottleSize: "Large", comment: "Hi mom!" } ])
  });
});

Deno.test("Where single condition", async () => {
  await withDatabase(async () => {
    await builder
      .insert("test", [
        { wine_id: 1, comment: "Hi mom!" },
        { wine_id: 2, comment: `A 'weird" one '' héhé` },
      ])
      .execute();

    const actual = await builder
      .select("wine_id")
      .from("test")
      .where({ field: "comment", equals: "Hi mom!" })
      .execute();

    assertEquals(actual, [{ wineId: 1 }]);
  });
});

async function withDatabase(block: () => Promise<void>) {
  await builder["executor"]["init"]();
  await builder["executor"]["client"]?.queryObject(
    "CREATE TEMP TABLE IF NOT EXISTS test (wine_id INTEGER, comment VARCHAR(255));",
  );

  await builder["executor"]["client"]?.queryObject(
    "CREATE TEMP TABLE IF NOT EXISTS test_2 (bottle_id INTEGER, bottle_size VARCHAR(255));",
  );

  await block();
  await builder["executor"]["client"]?.queryObject(
    "TRUNCATE test;",
  );
  await builder["executor"]["client"]?.queryObject(
    "TRUNCATE test_2;",
  );
  await builder["executor"]["client"]?.end();
}
