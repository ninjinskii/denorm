import { assertEquals } from "../deps.ts";
import { Nullable } from "../src/orm/annotations.ts";
import { Create, Field } from "../src/query/create.ts";
import { Insert } from "../src/query/insert.ts";
import { Select } from "../src/query/select.ts";
import { Update } from "../src/query/update.ts";
import { Where } from "../src/query/where.ts";

Deno.test("Select all", () => {
  const select = new Select("wine").toText().text;
  assertEquals(select, "SELECT * FROM wine;");
});

Deno.test("Select single field", () => {
  const select = new Select("wine", "wine_id").toText().text;
  assertEquals(select, "SELECT wine_id FROM wine;");
});

Deno.test("Select multiple fields", () => {
  const select = new Select("wine", "wine_id", "comment", "tasting_id")
    .toText().text;
  assertEquals(select, "SELECT wine_id, comment, tasting_id FROM wine;");
});

Deno.test("Where single equals int", () => {
  const conditions = { wine_id: 1 };
  const text = new Where(conditions).toText().text;

  assertEquals(text, "WHERE wine_id = 1;");
});

Deno.test("Where single equals string", () => {
  const conditions = { comment: "Hi mom!" };
  const  text = new Where(conditions).toText().text;

  assertEquals(text, "WHERE comment = 'Hi mom!';");
});

Deno.test("Where two equals AND", () => {
  const conditions = new Where({ wine_id: 1, comment: "Hi mom!" })
  const text = conditions.toText().text;

  assertEquals(text, "WHERE wine_id = 1 AND comment = 'Hi mom!';");
});

Deno.test("Insert into", () => {
  // Note that we set noAliasLookup to true to prevent an error
  // since the alias tracker is not initialized in this test file.
  const insert = new Insert("wine", [
    { wine_id: 1, comment: "Bon", tasting_taste_comment: "Je l'ai bien aimé" },
    { wine_id: 2, comment: "", tasting_taste_comment: "Moyen" },
  ], true);

  assertEquals(
    insert.toText().text,
    "INSERT INTO wine (wine_id, comment, tasting_taste_comment) VALUES ($1, $2, $3), ($4, $5, $6)",
  );
  assertEquals(insert.toText().args, [
    1,
    "Bon",
    "Je l'ai bien aimé",
    2,
    "",
    "Moyen",
  ]);
});

Deno.test("Create table", () => {
  const fields: Field[] = [
    { name: "id", type: "SERIAL", primaryKey: true, table: "", as: "id" },
    { name: "bottleId", type: "INT", as: "bottle_id", table: "" },
    { name: "tasting_id", type: "INT", nullable: Nullable.YES, table: "", as: "tasting_id" },
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

Deno.test("Update, single value string", () => {
  const update = new Update("wine", { comment: "Hi mom!" });
  const actual = update.toText().text;

  assertEquals(actual, "UPDATE wine SET comment = $1");
});
