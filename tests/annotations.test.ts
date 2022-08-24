import { type } from "https://deno.land/std@0.141.0/_wasm_crypto/crypto.wasm.mjs";
import { Bottle } from "../fixture/model/bottle.ts";
import { Wine } from "../fixture/model/wine.ts";
import { initTable } from "../src/orm/annotations.ts";

// Deno.test("Create single table", () => {
//   initTable(Wine, "wine");
//   initTable(Bottle, "bottle");
// });

Deno.test("Create multipe table", () => {
  // Won't work for now cause we're evalutating all annotations before processing a table.
  // So the field array is reset, and only the first type mentionned will see its table created
  //   const tables = [
  //     { type: Wine, table: "wine" },
  //     { type: Bottle, table: "bottle" },
  //   ];

  //   for (const table of tables) {
  //     console.log("___________________________________");
  //     initTable(table.type, table.table);
  //   }

  const bottle = initTable(Bottle, "bottle");
  const wine = initTable(Wine, "wine");


  console.log(wine)
  console.log("_____________")
  console.log(bottle)
});
