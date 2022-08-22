import { assertEquals, Client } from "../deps.ts";
import { From } from "../src/query/from.ts";
import { Insert } from "../src/query/insert.ts";
import { FieldTransformer, QueryBuilder } from "../src/query/query-builder.ts";
import { Select } from "../src/query/select.ts";
import { Where } from "../src/query/where.ts";
import { camelCase, snakeCase } from "../src/util/case.ts";

const client = new Client(Deno.env.get("DATABASE_URL"));

const transformer: FieldTransformer = {
  toDbField: (clientField) => snakeCase(clientField),
  fromDbField: (dbField) => camelCase(dbField),
};

const builder = new QueryBuilder(transformer);

Deno.test("Select all", () => {
  const select = new Select(transformer, "*").toText();
  assertEquals(select, "SELECT *");
});

Deno.test("Select single field", () => {
  const select = new Select(transformer, "wineId").toText();
  assertEquals(select, "SELECT wine_id");
});

Deno.test("Select multiple fields", () => {
  const select = new Select(transformer, "wineId", "comment", "tastingId")
    .toText();
  assertEquals(select, "SELECT wine_id,comment,tasting_id");
});

Deno.test("From single table", () => {
  const from = new From("wine").toText();
  assertEquals(from, "FROM wine");
});

Deno.test("From multiple tables", () => {
  const from = new From("wine", "bottle").toText();
  assertEquals(from, "FROM wine,bottle");
});

Deno.test("Where single equals int", () => {
  const conditions = { field: "wineId", equals: 1 };
  const where = new Where(transformer, conditions).toText();
  assertEquals(where, "WHERE wine_id = 1");
});

Deno.test("Where single equals string", () => {
  const conditions = { field: "comment", equals: "Hi mom!" };
  const where = new Where(transformer, conditions).toText();
  assertEquals(where, "WHERE comment = 'Hi mom!'");
});

// Figure out how to escape double quotes in Postgres. Do we need to escape them ?
// Deno.test("Where single special char equals string", () => {
//   const conditions = {
//     field: "comment",
//     equals: `Belle "explosion" de saveur à l'arrivée en bouche`,
//   };
//   const where = new Where(transformer, conditions).toText();
//   assertEquals(where, "WHERE comment = 'Belle explosion de saveur à l'arrivée en bouche'");
// });

Deno.test("Where two equals AND", () => {
  const conditions = new Where(transformer, { field: "wineId", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" });

  const where = conditions.toText();
  assertEquals(where, "WHERE wine_id = 1 AND comment = 'Hi mom!'");
});

Deno.test("Where multiple equals AND", () => {
  const conditions = new Where(transformer, { field: "wineId", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" })
    .and({ field: "type", equals: 1 });

  const where = conditions.toText();
  assertEquals(where, "WHERE wine_id = 1 AND comment = 'Hi mom!' AND type = 1");
});

Deno.test("Where multiple equals AND & OR", () => {
  const conditions = new Where(transformer, { field: "wineId", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" })
    .or({ field: "type", equals: 1 });

  const where = conditions.toText();
  assertEquals(where, "WHERE wine_id = 1 AND comment = 'Hi mom!' OR type = 1");
});

Deno.test("Where combined multiple equals AND", () => {
  const conditions = new Where(transformer, { field: "wineId", equals: 1 })
    .and([{ field: "comment", equals: "Hi mom!" }, {
      field: "type",
      equals: 2,
    }])
    .or({ field: "type", equals: 1 });

  const where = conditions.toText();
  assertEquals(
    where,
    "WHERE wine_id = 1 AND (comment = 'Hi mom!' AND type = 2) OR type = 1",
  );
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

  const where = conditions.toText();
  assertEquals(
    where,
    "WHERE (comment = 'Hi mom!' AND type = 2) OR (type = 1 OR type = 3)",
  );
});

Deno.test("Insert into", () => {
  const insert = new Insert(transformer, "wine", [
    { wineId: 1, comment: "Bon", tastingTasteComment: "Je l'ai bien aimé" },
    { wineId: 2, comment: "", tastingTasteComment: "Moyen" },
  ]);

  assertEquals(
    insert.toText(),
    "INSERT INTO wine ($1, $2, $3) VALUES ($4, $5, $6), ($7, $8, $9)",
  );
});

// Building blocks
Deno.test("Select + From, single values", () => {
  const query = builder
    .select("*")
    .from("wine")
    .execute();

  assertEquals(query, "SELECT * FROM wine;");
});

Deno.test("Select + From, multiple values", () => {
  const query = builder
    .select("wineId", "comment")
    .from("wine", "bottle")
    .execute();

  assertEquals(query, "SELECT wine_id,comment FROM wine,bottle;");
});

Deno.test("Select + From + Where, multiple values", () => {
  const query = builder
    .select("wineId", "comment")
    .from("wine", "bottle")
    .where({ field: "wineId", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" })
    .execute();

  assertEquals(
    query,
    "SELECT wine_id,comment FROM wine,bottle WHERE wine_id = 1 AND comment = 'Hi mom!';",
  );
});

// Sending our queries to database
Deno.test("Prepared args in DB", async () => {
  await client.connect();
  await client.queryObject(
    `CREATE TEMP TABLE IF NOT EXISTS test (wine_id INTEGER, comment VARCHAR(255));`,
  );
  await client.queryObject({
    text: "INSERT INTO test VALUES ($1, $2), ($3, $4);",
    args: [1, "Hi mom!", 2, `A 'weird" one '' héhé`],
  });

  const result = await client.queryObject({
    text:
      "SELECT wine_id, comment FROM test WHERE wine_id = $1 OR wine_id = $2;",
    args: [1, 2],
  });

  const expected = [
    { wine_id: 1, comment: "Hi mom!" },
    { wine_id: 2, comment: `A 'weird" one '' héhé` },
  ];

  await client.end();

  assertEquals(expected, result.rows)
});

Deno.test("Normal usage", async () => {
  
})
