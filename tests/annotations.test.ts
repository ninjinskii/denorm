import { Wine } from "../fixture/model/wine.ts";
import { initTable } from "../src/orm/annotations.ts";

Deno.test("Property annotation", () => {
    // initTable(new Wine(1, "", "", "", 1), "wine");
    initTable(new Wine(1, "", "", "", 1, 1, false), "wine");
});
