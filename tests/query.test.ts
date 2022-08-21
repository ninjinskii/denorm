import { assertEquals } from "../deps.ts";
import { From } from "../src/query/from.ts";
import { QueryBuilder } from "../src/query/query-builder.ts";
import { FieldTransformer } from "../src/query/query-part.ts";
import { Select } from "../src/query/select.ts";
import { Where } from "../src/query/where.ts";
import { camelCase, snakeCase } from "../src/util/case.ts";

Deno.test("Select all", () => {
  const select = new Select("*").toText();
  assertEquals(select, "SELECT *");
});

Deno.test("Select single field", () => {
  const select = new Select("wineId").toText();
  assertEquals(select, "SELECT wine_id");
});

Deno.test("Select multiple fields", () => {
  const select = new Select("wineId", "comment", "tastingId").toText();
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
  const where = new Where(conditions).toText();
  assertEquals(where, "WHERE wine_id = 1");
});

Deno.test("Where single equals string", () => {
  const conditions = { field: "comment", equals: "Hi mom!" };
  const where = new Where(conditions).toText();
  assertEquals(where, "WHERE comment = 'Hi mom!'");
});

// Figure out how to escape double quotes in Postgres. Do we need to escape them ?
// Deno.test("Where single special char equals string", () => {
//   const conditions = {
//     field: "comment",
//     equals: `Belle "explosion" de saveur à l'arrivée en bouche`,
//   };
//   const where = new Where(conditions).toText();
//   assertEquals(where, "WHERE comment = 'Belle explosion de saveur à l'arrivée en bouche'");
// });

Deno.test("Where two equals AND", () => {
  const conditions = new Where({ field: "wineId", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" });

  const where = conditions.toText();
  assertEquals(where, "WHERE wine_id = 1 AND comment = 'Hi mom!'");
});

Deno.test("Where multiple equals AND", () => {
  const conditions = new Where({ field: "wineId", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" })
    .and({ field: "type", equals: 1 });

  const where = conditions.toText();
  assertEquals(where, "WHERE wine_id = 1 AND comment = 'Hi mom!' AND type = 1");
});

Deno.test("Where multiple equals AND & OR", () => {
  const conditions = new Where({ field: "wineId", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" })
    .or({ field: "type", equals: 1 });

  const where = conditions.toText();
  assertEquals(where, "WHERE wine_id = 1 AND comment = 'Hi mom!' OR type = 1");
});

Deno.test("Where combined multiple equals AND", () => {
  const conditions = new Where({ field: "wineId", equals: 1 })
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
  const conditions = new Where()
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

// Building the blocks
const transformer: FieldTransformer = {
  toDbField: (clientName) => snakeCase(clientName),
  fromDbField: (fieldName) => camelCase(fieldName),
};
const builder = new QueryBuilder(transformer);

Deno.test("Select + From, single values", () => {
  const select = new Select("*");
  const from = new From("wine");

  builder.combineAll(select, from);
  assertEquals(builder.terminate(), "SELECT * FROM wine;");
});

Deno.test("Select + From, multiple values", () => {
  const select = new Select("wineId", "comment");
  const from = new From("wine", "bottle");

  builder.combineAll(select, from);
  assertEquals(
    builder.terminate(),
    "SELECT wine_id,comment FROM wine,bottle;",
  );
});

Deno.test("Select + From + Where, multiple values", () => {
  const select = new Select("wineId", "comment");
  const from = new From("wine", "bottle");
  const where = new Where({ field: "wineId", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" });

  builder.combineAll(select, from, where);
  assertEquals(
    builder.terminate(),
    "SELECT wine_id,comment FROM wine,bottle WHERE wine_id = 1 AND comment = 'Hi mom!';",
  );
});
