import { assertEquals } from "../deps.ts";
import { camelCase, snakeCase } from "../src/util/case.ts";

Deno.test("Kebab to snake case", () => {
  const kebab = "history-x-friend";
  const snake = snakeCase(kebab);

  assertEquals(snake, "history_x_friend");
});

Deno.test("Camel to snake case", () => {
  const pascal = "historyXFriend";
  const snake = snakeCase(pascal);

  assertEquals(snake, "history_x_friend");
});

Deno.test("Snake and variants to Camel case", () => {
  const snake = "account_id";
  const snake2 = " id";
  const snake3 = " TastingId";
  const snake4 = " History_id";
  const snake5 = " tasting_taste_comment ";
  const snake6 = " pascalCase";

  const camel = camelCase(snake);
  const camel2 = camelCase(snake2);
  const camel3 = camelCase(snake3);
  const camel4 = camelCase(snake4);
  const camel5 = camelCase(snake5);
  const camel6 = camelCase(snake6);

  assertEquals(camel, "accountId");
  assertEquals(camel2, "id");
  assertEquals(camel3, "tastingId");
  assertEquals(camel4, "historyId");
  assertEquals(camel5, "tastingTasteComment");
  assertEquals(camel6, "pascalCase");
});
