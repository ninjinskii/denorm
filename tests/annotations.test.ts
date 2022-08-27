import { assertEquals } from "../deps.ts";
import { initTables, SizedField } from "../src/orm/annotations.ts";
import { QueryBuilder } from "../src/query/query-builder.ts";

const databaseUrl = Deno.env.get("DATABASE_URL") || "";
const builder = new QueryBuilder(databaseUrl);

Deno.test("Create single table", async () => {
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

import { Entity, Field, Nullable, PrimaryKey } from "../src/orm/annotations.ts";

@Entity("bottle")
class Bottle {
  constructor(
    @PrimaryKey("SERIAL", "bottle_id") public bottleId: number,
    @Field("VARCHAR", Nullable.NO, "bottle_size") public bottleSize: string,
  ) {
  }
}

@Entity("wine")
class Wine {
  constructor(
    @PrimaryKey("SERIAL") public id: number,
    @Field("VARCHAR") public naming: string,
    @Field("VARCHAR", Nullable.YES) public name: string | null,
    @SizedField("VARCHAR", 255) public comment: string,
    @Field("INT", Nullable.NO, "bottle_id") public bottleId: number,
    @Field("BIGINT") public date: bigint,
    @Field("BOOL", Nullable.NO, "taste_good") public tasteGood: boolean,
  ) {
  }
}
