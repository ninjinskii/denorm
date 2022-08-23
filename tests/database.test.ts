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

  await block();
  await builder["executor"]["client"]?.end();
}
