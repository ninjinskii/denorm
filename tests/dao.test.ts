import { assertEquals, Client } from "../deps.ts";
import { initTables } from "../src/orm/annotations.ts";
import { Bottle, OtherDao, TestDao, Wine } from "../src/orm/dao.ts";
import { Update } from "../src/query/update.ts";
import { transaction } from "../src/transaction/transaction.ts";

// TODO:: remove alias tracker and update INSERT accordingly

const client = new Client(Deno.env.get("DATABASE_URL"));
const wines = [
  { id: 1, name: "Immelé", naming: "Gewurtz", isOrganic: true },
  { id: 2, name: "Nom", naming: "Riesling", isOrganic: false },
];

const updatedWines = [
  { id: 1, name: "F. Engel", naming: "Pessac", isOrganic: false },
  { id: 2, name: "Pouilly", naming: "Chianti", isOrganic: false },
];

Deno.test("Insert annotation", async () => {
  await initTables(client, [Wine, Bottle]);
  const actual = await withClient(async () => {
    await client.queryObject("DELETE FROM wine");
    const dao = new TestDao(client);
    return await dao.insert(wines);
  });

  // Number of expected inserted rows
  assertEquals(actual, 2);
});

Deno.test("Select annotation", async () => {
  const actual = await withClient(async () => {
    const dao = new TestDao(client);
    return await dao.getAll();
  });

  assertEquals(actual, wines);
});

// This test lives here and not in query.test.ts bc UpdateMass needs table initializaiton (to fetch PK) to work.
Deno.test("Mass update without db", () => {
  const updateRaw = new Update("wine", wines);

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

Deno.test("Mass update with db", async () => {
  const rowsUpdated = await withClient(async () => {
    const dao = new TestDao(client);
    return await dao.update(updatedWines);
  });

  const actual = await withClient(async () => {
    const dao = new TestDao(client);
    return await dao.getAll();
  });

  assertEquals(rowsUpdated, updatedWines.length);
  assertEquals(actual, updatedWines);
});

Deno.test("Delete annotation", async () => {
  const rowDeleted = await withClient(async () => {
    const dao = new TestDao(client);
    return await dao.delete();
  });

  const actual = await withClient(async () => {
    const dao = new TestDao(client);
    return await dao.getAll();
  });

  assertEquals(rowDeleted, 1);
  assertEquals(actual.length, 1);
});

Deno.test("Query annotation", async () => {
  const actual = await withClient(async () => {
    const dao = new TestDao(client);
    return await dao.getWineById(2, 3);
  });

  assertEquals(actual, [{ id: 2, name: "Pouilly", naming: "Ch" }]);
});

Deno.test("Transaction", async () => {
  const actual = await withClient(async () => {
    const dao = new TestDao(client);
    const oDao = new OtherDao(client);

    const success = await transaction([dao, oDao], async () => {
      await dao.getWineById(2, 3);
      await oDao.getAll();
    });

    await dao.getWineById(2, 3);
    await oDao.getAll();

    return success;
  });

  assertEquals(actual, true);
});

async function withClient<T>(block: () => Promise<T>) {
  await client.connect();
  const result = await block();
  await client.end();
  return result;
}
