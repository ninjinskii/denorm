import { type } from "https://deno.land/std@0.141.0/_wasm_crypto/crypto.wasm.mjs";
import { Bottle } from "../fixture/model/bottle.ts";
import { Wine } from "../fixture/model/wine.ts";
import { initTables } from "../src/orm/annotations.ts";

Deno.test("Create single table", () => {
  initTables([Wine]);
});

Deno.test("Create multipe table", () => {
  initTables([Wine, Bottle]);
});
