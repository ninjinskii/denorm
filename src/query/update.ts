// We want to be generic
// deno-lint-ignore-file no-explicit-any
import { fields } from "../annotations/fields.ts";

// Give a list of objects directly, instead of field to modify
export class Update {
  private tableName: string;
  private objects: any[];

  constructor(tableName: string, objects: any[]) {
    this.tableName = tableName;
    this.objects = objects;

    if (Object.keys(objects).length === 0) {
      throw Error("Cannot perform empty UPDATE query");
    }
  }

  getPreparedQueries() {
    const queries = [];
    const groupedPreparedValues = [];
    const tableFields = fields.filter((field) =>
      field.table === this.tableName
    );
    const primaryKey = tableFields.find((field) =>
      field.table === this.tableName && field.primaryKey
    )?.name;

    if (!primaryKey) {
      throw new Error(
        `Table "${this.tableName}" has no primary key, use @PrimaryKey on a property.`,
      );
    }

    for (const object of this.objects) {
      const start = `UPDATE ${this.tableName} SET`;
      const end = `WHERE ${primaryKey} = ${object[primaryKey]}`;
      const updateText = [];
      const preparedValues = [];
      let preparedArgsCounter = 1;

      for (const key of Object.keys(object)) {
        const alias = tableFields.find((field) => field.name === key)?.as ||
          key;

        updateText.push(`${alias} = $${preparedArgsCounter++}`);
        preparedValues.push(object[key as never]);
      }

      queries.push(`${start} ${updateText.join(", ")} ${end}`);
      groupedPreparedValues.push(preparedValues);
    }

    return { queries, groupedPreparedValues };
  }
}
