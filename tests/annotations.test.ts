import { type } from "https://deno.land/std@0.141.0/_wasm_crypto/crypto.wasm.mjs";
import { Bottle } from "../fixture/model/bottle.ts";
import { Wine } from "../fixture/model/wine.ts";
import { initTable } from "../src/orm/annotations.ts";

Deno.test("Property annotation", () => {
  // We won't use the type parameter, but evaluating it wiil trigger class properties annotations
  const tables = [
    { type: Wine, table: "wine" },
    { type: Bottle, table: "bottle" },
  ];

  for (const table of tables) {
    console.log("___________________________________");
    initTable(table.type, table.table);
  }
});
