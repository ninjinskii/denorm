import { assertEquals } from "../deps.ts";
import { Nullable } from "../src/orm/annotations.ts";
import { Create, Field } from "../src/query/create.ts";
import { Delete } from "../src/query/delete.ts";
import { From } from "../src/query/from.ts";
import { Insert } from "../src/query/insert.ts";
import { QueryBuilder } from "../src/query/query-builder.ts";
import { Select } from "../src/query/select.ts";
import { Update } from "../src/query/update.ts";
import { Where } from "../src/query/where.ts";

const databaseUrl = Deno.env.get("DATABASE_URL") || "";
const builder = new QueryBuilder(databaseUrl);

Deno.test("Select all", () => {
  const select = new Select("*").toText().text;
  assertEquals(select, "SELECT *");
});

Deno.test("Select single field", () => {
  const select = new Select("wine_id").toText().text;
  assertEquals(select, "SELECT wine_id");
});

Deno.test("Select multiple fields", () => {
  const select = new Select("wine_id", "comment", "tasting_id")
    .toText().text;
  assertEquals(select, "SELECT wine_id, comment, tasting_id");
});

Deno.test("From single table", () => {
  const from = new From("wine").toText().text;
  assertEquals(from, "FROM wine");
});

Deno.test("From multiple tables", () => {
  const from = new From("wine", "bottle").toText().text;
  assertEquals(from, "FROM wine, bottle");
});

Deno.test("Where single equals int", () => {
  const conditions = { field: "wine_id", equals: 1 };
  const { text, args } = new Where(conditions).toText();

  assertEquals(text, "WHERE wine_id = $1");
  assertEquals(args, [1]);
});

Deno.test("Where single equals string", () => {
  const conditions = { field: "comment", equals: "Hi mom!" };
  const { text, args } = new Where(conditions).toText();

  assertEquals(text, "WHERE comment = $1");
  assertEquals(args, ["Hi mom!"]);
});

Deno.test("Where two equals AND", () => {
  const conditions = new Where({ field: "wine_id", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" });

  const { text, args } = conditions.toText();

  assertEquals(text, "WHERE wine_id = $1 AND comment = $2");
  assertEquals(args, [1, "Hi mom!"]);
});

Deno.test("Where multiple equals AND", () => {
  const conditions = new Where({ field: "wine_id", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" })
    .and({ field: "type", equals: 1 });

  const { text, args } = conditions.toText();

  assertEquals(text, "WHERE wine_id = $1 AND comment = $2 AND type = $3");
  assertEquals(args, [1, "Hi mom!", 1]);
});

Deno.test("Where multiple equals AND & OR", () => {
  const conditions = new Where({ field: "wine_id", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" })
    .or({ field: "type", equals: 1 });

  const { text, args } = conditions.toText();

  assertEquals(text, "WHERE wine_id = $1 AND comment = $2 OR type = $3");
  assertEquals(args, [1, "Hi mom!", 1]);
});

Deno.test("Where combined multiple equals AND", () => {
  const conditions = new Where({ field: "wine_id", equals: 1 })
    .and([{ field: "comment", equals: "Hi mom!" }, {
      field: "type",
      equals: 2,
    }])
    .or({ field: "type", equals: 1 });

  const { text, args } = conditions.toText();
  assertEquals(
    text,
    "WHERE wine_id = $1 AND (comment = $2 AND type = $3) OR type = $4",
  );
  assertEquals(args, [1, "Hi mom!", 2, 1]);
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

  const { text, args } = conditions.toText();
  assertEquals(
    text,
    "WHERE (comment = $1 AND type = $2) OR (type = $3 OR type = $4)",
  );
  assertEquals(args, ["Hi mom!", 2, 1, 3]);
});

Deno.test("Insert into", () => {
  const insert = new Insert("wine", [
    { wine_id: 1, comment: "Bon", tasting_taste_comment: "Je l'ai bien aimé" },
    { wine_id: 2, comment: "", tasting_taste_comment: "Moyen" },
  ]);

  assertEquals(
    insert.toText().text,
    "INSERT INTO wine (wine_id, comment, tasting_taste_comment) VALUES ($1, $2, $3), ($4, $5, $6)",
  );
});

Deno.test("Create table", () => {
  const fields: Field[] = [
    { name: "id", type: "SERIAL", primaryKey: true },
    { name: "bottleId", type: "INT", as: "bottle_id" },
    { name: "tasting_id", type: "INT", nullable: Nullable.YES },
  ];

  const create = new Create("wine", fields);
  const actual = create.toText().text;

  assertEquals(
    actual,
    `CREATE TABLE IF NOT EXISTS wine (id SERIAL PRIMARY KEY, bottle_id INT NOT NULL, tasting_id INT);`,
  );
});

Deno.test("Update, single value", () => {
  const update = new Update("wine", { wine_id: 1 });
  const actual = update.toText().text;

  assertEquals(actual, "UPDATE wine SET wine_id = $1");
});

Deno.test("Update, single value", () => {
  const update = new Update("wine", { comment: "Hi mom!" });
  const actual = update.toText().text;

  assertEquals(actual, "UPDATE wine SET comment = $1");
});

Deno.test("Delete", () => {
  const del = new Delete();
  assertEquals(del.toText().text, "DELETE");
});

// Building blocks
Deno.test("Select + From, single values", () => {
  const query = builder
    .select("*")
    .from("wine")
    .toText().text;

  assertEquals(query, "SELECT * FROM wine;");
});

Deno.test("Select + From, multiple values", () => {
  const query = builder
    .select("wine_id", "comment")
    .from("wine", "bottle")
    .toText().text;

  assertEquals(query, "SELECT wine_id, comment FROM wine, bottle;");
});

Deno.test("Select + From + Where, multiple values", () => {
  const { text, args } = builder
    .select("wine_id", "comment")
    .from("wine", "bottle")
    .where({ field: "wine_id", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" })
    .toText();

  assertEquals(
    text,
    "SELECT wine_id, comment FROM wine, bottle WHERE wine_id = $1 AND comment = $2;",
  );
  assertEquals(args, [1, "Hi mom!"]);
});

Deno.test("Update + Where, single value", () => {
  const { text, args } = builder
    .update("wine", { comment: "Hey" })
    .where({ field: "wine_id", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" })
    .toText();

  assertEquals(
    text,
    "UPDATE wine SET comment = $1 WHERE wine_id = $2 AND comment = $3;",
  );
  assertEquals(args, ["Hey", 1, "Hi mom!"]);
});

Deno.test("Delete + From + Where, single value", () => {
  const { text, args } = builder
    .delete()
    .from("wine")
    .where({ field: "wine_id", equals: 1 })
    .and({ field: "comment", equals: "Hi mom!" })
    .toText();

  assertEquals(
    text,
    "DELETE FROM wine WHERE wine_id = $1 AND comment = $2;",
  );
  assertEquals(args, [1, "Hi mom!"]);
});
