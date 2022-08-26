import { QueryBuilder } from "../query/query-builder.ts";

export default async function transaction(
  builder: QueryBuilder,
  block: () => Promise<void>,
): Promise<boolean> {
  const executor = builder.getExecutor();
  await executor.startTransaction();

  let ok = true;

  try {
    await block();
  } catch (_error) {
    ok = false;
  } finally {
    builder.reset();
    await executor.endTransaction();
  }

  return ok;
}
