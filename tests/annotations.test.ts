import { assertEquals } from "../deps.ts";
import { Bottle } from "../fixture/model/bottle.ts";
import { Wine } from "../fixture/model/wine.ts";
import { initTables } from "../src/orm/annotations.ts";
import { QueryBuilder } from "../src/query/query-builder.ts";

const databaseUrl = Deno.env.get("DATABASE_URL") || "";
const builder = new QueryBuilder(databaseUrl);

Deno.test("Create single table", async () => {
  console.log("Running a test in annotations");
  console.warn("Running a test in annotations");
  await withDatabase(async () => {
    await dropTables();
    await initTables(databaseUrl, [Wine]);
    await builder
      .insert("wine", [{
        id: 1,
        naming: "Hi mom!",
        name: null,
        comment: "",
        bottle_id: 1,
        date: 1n,
        taste_good: true,
      }])
      .execute();

    const result = await builder
      .select("*")
      .from("wine")
      .execute();

    assertEquals(result, [{
      id: 1,
      naming: "Hi mom!",
      name: null,
      comment: "",
      bottleId: 1,
      date: 1n,
      tasteGood: true,
    }]);
  });
});

Deno.test("Create multipe table", async () => {
  await withDatabase(async () => {
    await dropTables();
    await initTables(databaseUrl, [Wine, Bottle]);
    await builder
      .insert("wine", [{
        id: 1,
        naming: "Hi mom!",
        name: null,
        comment: "",
        bottle_id: 1,
        date: 1n,
        taste_good: true,
      }])
      .execute();

    await builder
      .insert("bottle", [{ bottle_id: 1, bottle_size: "" }])
      .execute();

    const result = await builder
      .select("*")
      .from("wine")
      .execute();

    const result2 = await builder
      .select("*")
      .from("bottle")
      .execute();

    assertEquals(result2, [{ bottleId: 1, bottleSize: "" }]);
    assertEquals(result, [{
      id: 1,
      naming: "Hi mom!",
      name: null,
      comment: "",
      bottleId: 1,
      date: 1n,
      tasteGood: true,
    }]);
  });
});

async function withDatabase(block: () => Promise<void>) {
  await builder["executor"]["init"]();
  await block();
  await builder["executor"]["client"]?.end();
}

async function dropTables() {
  await builder["executor"]["client"]?.queryObject(
    "DROP TABLE IF EXISTS wine, bottle;",
  );
}
