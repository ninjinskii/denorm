import { assertEquals } from "../deps.ts";
import {
  Entity,
  Field,
  initTables,
  Nullable,
  PrimaryKey,
} from "../src/orm/annotations.ts";
import { FieldTransformer, QueryBuilder } from "../src/query/query-builder.ts";
import { snakeCase } from "../src/util/case.ts";

const databaseUrl = Deno.env.get("DATABASE_URL") || "";
const transformer: FieldTransformer = {
  toDbField: (clientField) => snakeCase(clientField),
  fromDbField: (dbField) => dbField,
  usePostgresNativeCamel: true,
};

const builder = new QueryBuilder(
  transformer,
  databaseUrl,
);

Deno.test("Create single table", async () => {
  await withDatabase(async () => {
    await dropTables();
    await initTables(databaseUrl, [Annotations]);
    await builder
      .insert("annotations", [{ id: 1, comment: "Hi mom!" }])
      .execute();

    const result = await builder
      .select("*")
      .from("annotations")
      .execute();

    assertEquals(result, [{ id: 1, comment: "Hi mom!" }]);
  });
});

Deno.test("Create multipe table", async () => {
  await withDatabase(async () => {
    await dropTables();
    await initTables(databaseUrl, [Annotations, Annotations2]);
    await builder
      .insert("annotations", [{ id: 2, comment: "Hi mom!" }])
      .execute();

    await builder
      .insert("annotations_2", [{ id: 1, comment: null }])
      .execute();

    const result = await builder
      .select("*")
      .from("annotations")
      .execute();

    const result2 = await builder
      .select("*")
      .from("annotations_2")
      .execute();

    assertEquals(result, [{ id: 2, comment: "Hi mom!" }]);
    assertEquals(result2, [{ id: 1, comment: null }]);
  });
});

async function withDatabase(block: () => Promise<void>) {
  await builder["executor"]["init"]();
  await block();
  await builder["executor"]["client"]?.end();
}

async function dropTables() {
  await builder["executor"]["client"]?.queryObject(
    "DROP TABLE IF EXISTS annotations, annotations_2;",
  );
}

@Entity("annotations")
class Annotations {
  constructor(
    @PrimaryKey("SERIAL") public id: number,
    @Field("VARCHAR") public comment: string,
  ) {
  }
}

@Entity("annotations_2")
class Annotations2 {
  constructor(
    @PrimaryKey("SERIAL") public id: number,
    @Field("VARCHAR", Nullable.YES) public comment: string | null,
  ) {
  }
}
