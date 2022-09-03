import { assertEquals, Client } from "../deps.ts";
import { initTables } from "../src/orm/annotations.ts";
import { Bottle, Dao, TestDao, Wine } from "../src/orm/dao.ts";
import { UpdateMass } from "../src/query/update-mass.ts";

// TODO: add semi colon at end of query. RN its qury builder that's doing it.
// TODO: refactor SELECT that now should include FROM as well
// TODO: try to remove the tableFields thign for Select queries. Automtaic support for multiple queries will no
// longer be supported, but you can still do a @Query() with your special select
// TODO: in UPDATE, use "as" instead of aliasTracker, bc now every field will have the "as" set

const client = new Client(Deno.env.get("DATABASE_URL"));
const wines = [
  { id: 1, name: "Immelé", naming: "Gewurtz", isOrganic: true },
  { id: 2, name: "Nom", naming: "Riesling", isOrganic: false },
];

Deno.test("Mass update", async () => {
  await initTables(Deno.env.get("DATABASE_URL") || "", [Wine, Bottle]);
  const updateRaw = new UpdateMass("wine", wines);

  const { queries, groupedPreparedValues } = updateRaw.getPreparedQueries();
  assertEquals(queries, [
    "UPDATE wine SET id = $1, name = $2, naming = $3, is_organic = $4 WHERE id = 1",
    "UPDATE wine SET id = $1, name = $2, naming = $3, is_organic = $4 WHERE id = 2",
  ]);

  assertEquals(
    groupedPreparedValues,
    [[1, "Immelé", "Gewurtz", true], [2, "Nom", "Riesling", false]],
  );
});

// Deno.test("Insert annotation", async () => {
//   const actual = await withClient(async () => {
//     const dao = new TestDao(client);
//     return await dao.insertWines(wines);
//   });

//   // Number of expected inserted rows
//   assertEquals(actual, 2);
// });

Deno.test("Select annotation", async () => {
  const actual = await withClient(async () => {
    const dao = new TestDao(client);
    return await dao.getAllWines();
  });

  assertEquals(actual, wines);
});

// Deno.test("Query annotation", async () => {
//   const actual = await withClient(async () => {
//     const dao = new TestDao(client);
//     const result = await dao.getWineById(1);
//   });
// });

async function withClient<T>(block: () => Promise<T>) {
  await client.connect();
  const result = await block();
  await client.end();
  return result;
}
