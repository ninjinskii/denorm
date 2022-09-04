// We will work a lot with any since we're trying to be as generic as possible to insert anything in the db.
// deno-lint-ignore-file no-explicit-any
import { fields } from "../annotations/fields.ts";
import { PreparedQueryText, QueryPart } from "./query.ts";

interface InsertValues {
  values: any[];
  preparedValues: string;
}

export class Insert extends QueryPart {
  private tableName: string;
  private objects: any[];
  private noAliasLookup: boolean;

  constructor(tableName: string, objects: any[], noAliasLookup?: boolean) {
    super();
    this.tableName = tableName;
    this.objects = objects;
    this.noAliasLookup = noAliasLookup || false;

    if (this.objects.length === 0) {
      throw new Error("Insert cannot be empty");
    }
  }

  toText(): PreparedQueryText {
    const fields = this.extractFields();
    const { values, preparedValues } = this.extractValues();
    const args = values;
    const text =
      `INSERT INTO ${this.tableName} (${fields}) VALUES ${preparedValues}`;

    return { text, args };
  }

  private extractFields(): string {
    // We'll use the first object to determine fields to update
    const exampleObject = this.objects[0];
    return Object.keys(exampleObject).map((key) => {
      if (this.noAliasLookup) {
        return key;
      }

      return fields.find((field) =>
        field.table === this.tableName && field.name === key
      )
        ?.as || key;
    }).join(", ");
  }

  private extractValues(): InsertValues {
    const values: any[] = [];
    const preparedValuesArray = [];
    let preparedArgsCounter = 1;

    for (const object of this.objects) {
      const objectPreparedValuesArray = [];

      for (const value of Object.values(object)) {
        objectPreparedValuesArray.push(`$${preparedArgsCounter++}`);
        values.push(value);
      }

      preparedValuesArray.push(`(${objectPreparedValuesArray.join(", ")})`);
    }

    const preparedValues = preparedValuesArray.join(", ");
    return { values, preparedValues };
  }
}
