import { assertEquals, Client } from "../deps.ts";
import { initTables } from "../src/orm/annotations.ts";
import { Bottle, Dao, TestDao, Wine } from "../src/orm/dao.ts";
import { UpdateRaw } from "../src/query/update-from-raw-objects.ts";

const client = new Client(Deno.env.get("DATABASE_URL"));

// Deno.test("Select annotation", async () => {
//   const actual = await withClient(async () => {
//     const dao = new TestDao(client);
//     const result = await dao.getAllWines();
//   });
// });

// Deno.test("Query annotation", async () => {
//   const actual = await withClient(async () => {
//     const dao = new TestDao(client);
//     const result = await dao.getWineById(1);
//   });
// });

Deno.test("Update raw", async () => {
  await initTables(Deno.env.get("DATABASE_URL") || "", [Wine]);
  const updateRaw = new UpdateRaw("wine", [{
    id: 1,
    name: "Immelé",
    naming: "Gewurtz",
    isOrganic: true,
  }]);

  console.log(updateRaw.getPreparedQuery());
});

async function withClient(block: () => Promise<void>) {
  await client.connect();
  const result = await block();
  await client.end();
  return result;
}
