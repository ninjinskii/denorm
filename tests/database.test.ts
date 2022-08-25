import { assertEquals } from "../deps.ts";
import { QueryBuilder } from "../src/query/query-builder.ts";

const databaseUrl = Deno.env.get("DATABASE_URL") || "";
const builder = new QueryBuilder(databaseUrl);

// IMPORTANT NOTE
// Expected objects properties are in snake case.
// This is normal, since in this file we don't init tables,
// thus not populating the client / db field mapper.
// Check annotations.test.ts to see properties named like
// the original object.

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

    assertEquals(actual, { wine_id: 1, comment: "Hi mom!" });
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
      { wine_id: 1, comment: "Hi mom!" },
      { wine_id: 2, comment: `A 'weird" one '' héhé` },
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

    assertEquals(actual, [{ bottle_size: "Large", comment: "Hi mom!" }]);
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

    assertEquals(actual, [{ wine_id: 1 }]);
  });
});

Deno.test("Update single field", async () => {
  await withDatabase(async () => {
    await builder
      .insert("test", [
        { wine_id: 1, comment: "Hi mom!" },
        { wine_id: 2, comment: `A 'weird" one '' héhé` },
      ])
      .execute();

    await builder
      .update("test", { field: "wine_id", value: 3 })
      .where({ field: "comment", equals: "Hi mom!" })
      .execute();

    const actual = await builder
      .select("wine_id")
      .from("test")
      .where({ field: "comment", equals: "Hi mom!" })
      .execute();

    assertEquals(actual, [{ wine_id: 3 }]);
  });
});

Deno.test("Delete single row", async () => {
  await withDatabase(async () => {
    await builder
      .insert("test", [
        { wine_id: 1, comment: "Hi mom!" },
        { wine_id: 2, comment: `A 'weird" one '' héhé` },
      ])
      .execute();

    await builder
      .delete()
      .from("test")
      .where({ field: "comment", equals: "Hi mom!" })
      .execute();

    console.log(builder);

    const actual = await builder
      .select("*")
      .from("test")
      .execute();

    assertEquals(actual.length, 1);
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
