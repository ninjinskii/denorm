import { Bottle } from "../fixture/model/bottle.ts";
import { Wine } from "../fixture/model/wine.ts";
import { initTables } from "../src/orm/annotations.ts";

const databaseUrl = Deno.env.get("DATABASE_URL") || ""

Deno.test("Create single table", () => {
  initTables(databaseUrl, [Wine]);
});

Deno.test("Create multipe table", () => {
  initTables(databaseUrl, [Wine, Bottle]);
});
