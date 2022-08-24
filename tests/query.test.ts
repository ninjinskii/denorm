import { assertEquals } from "../deps.ts";
import { Nullable } from "../src/orm/annotations.ts";
import { Create, Field } from "../src/query/create.ts";
import { From } from "../src/query/from.ts";
import { Insert } from "../src/query/insert.ts";
import { FieldTransformer, QueryBuilder } from "../src/query/query-builder.ts";
import { Select } from "../src/query/select.ts";
import { Where } from "../src/query/where.ts";
import { camelCase, snakeCase } from "../src/util/case.ts";

const transformer: FieldTransformer = {
  toDbField: (clientField) => snakeCase(clientField),
  fromDbField: (dbField) => camelCase(dbField),
};

const builder = new QueryBuilder(
  transformer,
  Deno.env.get("DATABASE_URL") || "",
);

Deno.test("Select all", () => {
  const select = new Select(transformer, "*").toPreparedQuery().text;
  assertEquals(select, "SELECT *");
});

Deno.test("Select single field", () => {
  const select = new Select(transformer, "wineId").toPreparedQuery().text;
  assertEquals(select, "SELECT wine_id");
});

Deno.test("Select multiple fields", () => {
  const select = new Select(transformer, "wineId", "comment", "tastingId")
    .toPreparedQuery().text;
  assertEquals(select, "SELECT wine_id,comment,tasting_id");
});

Deno.test("From single table", () => {
  const from = new From("wine").toPreparedQuery().text;
  assertEquals(from, "FROM wine");
});

Deno.test("From multiple tables", () => {
  const from = new From("wine", "bottle").toPreparedQuery().text;
  assertEquals(from, "FROM wine,bottle");
});

Deno.test("Where single equals int", () => {
  const conditions = { field: "wineId", equals: 1 };
  const { text, args } = new Where(transformer, conditions).toPreparedQuery();

  assertEquals(text, "WHERE wine_id = $1");
  assertEquals(args, [1]);
});

Deno.test("Where single equals string", () => {
  const conditions = { field: "comment", equals: "Hi mom!" };
  const { text, args } = new Where(transformer, conditions).toPreparedQuery();

  assertEquals(text, "WHERE comment = $1");
  assertEquals(args, ["Hi mom!"]);
});

Deno.test("Where two equals AND", () => {
  const conditions = new Where(transformer, { field: "wineId", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" });

  const { text, args } = conditions.toPreparedQuery();

  assertEquals(text, "WHERE wine_id = $1 AND comment = $2");
  assertEquals(args, [1, "Hi mom!"]);
});

Deno.test("Where multiple equals AND", () => {
  const conditions = new Where(transformer, { field: "wineId", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" })
    .and({ field: "type", equals: 1 });

  const { text, args } = conditions.toPreparedQuery();

  assertEquals(text, "WHERE wine_id = $1 AND comment = $2 AND type = $3");
  assertEquals(args, [1, "Hi mom!", 1]);
});

Deno.test("Where multiple equals AND & OR", () => {
  const conditions = new Where(transformer, { field: "wineId", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" })
    .or({ field: "type", equals: 1 });

  const { text, args } = conditions.toPreparedQuery();

  assertEquals(text, "WHERE wine_id = $1 AND comment = $2 OR type = $3");
  assertEquals(args, [1, "Hi mom!", 1]);
});

Deno.test("Where combined multiple equals AND", () => {
  const conditions = new Where(transformer, { field: "wineId", equals: 1 })
    .and([{ field: "comment", equals: "Hi mom!" }, {
      field: "type",
      equals: 2,
    }])
    .or({ field: "type", equals: 1 });

  const { text, args } = conditions.toPreparedQuery();
  assertEquals(
    text,
    "WHERE wine_id = $1 AND (comment = $2 AND type = $3) OR type = $4",
  );
  assertEquals(args, [1, "Hi mom!", 2, 1]);
});

Deno.test("Where combined only multiple equals AND & OR", () => {
  const conditions = new Where(transformer)
    .and([
      { field: "comment", equals: "Hi mom!" },
      { field: "type", equals: 2 },
    ])
    .or([
      { field: "type", equals: 1 },
      { field: "type", equals: 3 },
    ]);

  const { text, args } = conditions.toPreparedQuery();
  assertEquals(
    text,
    "WHERE (comment = $1 AND type = $2) OR (type = $3 OR type = $4)",
  );
  assertEquals(args, ["Hi mom!", 2, 1, 3]);
});

Deno.test("Insert into", () => {
  const insert = new Insert(transformer, "wine", [
    { wineId: 1, comment: "Bon", tastingTasteComment: "Je l'ai bien aimé" },
    { wineId: 2, comment: "", tastingTasteComment: "Moyen" },
  ]);

  assertEquals(
    insert.toPreparedQuery().text,
    "INSERT INTO wine (wine_id, comment, tasting_taste_comment) VALUES ($1, $2, $3), ($4, $5, $6)",
  );
});

Deno.test("Create table", () => {
  const fields: Field[] = [
    { name: "id", type: "SERIAL", primaryKey: true },
    { name: "bottleId", type: "INT", as: "bottle_id" },
    { name: "tasting_id", type: "INT", nullable: Nullable.YES },
  ];

  const create = new Create(transformer, "wine", fields);
  const actual = create.toPreparedQuery().text;

  assertEquals(
    actual,
    `CREATE TABLE IF NOT EXISTS wine (id SERIAL PRIMARY KEY, bottle_id INT NOT NULL, tasting_id INT);`,
  );
});

// Building blocks
Deno.test("Select + From, single values", () => {
  const query = builder
    .select("*")
    .from("wine")
    .getPreparedQuery().text;

  assertEquals(query, "SELECT * FROM wine;");
});

Deno.test("Select + From, multiple values", () => {
  const query = builder
    .select("wineId", "comment")
    .from("wine", "bottle")
    .getPreparedQuery().text;

  assertEquals(query, "SELECT wine_id,comment FROM wine,bottle;");
});

Deno.test("Select + From + Where, multiple values", () => {
  const { text, args } = builder
    .select("wineId", "comment")
    .from("wine", "bottle")
    .where({ field: "wineId", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" })
    .getPreparedQuery();

  assertEquals(
    text,
    "SELECT wine_id,comment FROM wine,bottle WHERE wine_id = $1 AND comment = $2;",
  );
  assertEquals(args, [1, "Hi mom!"]);
});
