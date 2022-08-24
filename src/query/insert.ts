// We will work a lot with any since we're trying to be as generic as possible to insert anything in the db.
// deno-lint-ignore-file no-explicit-any
import { QueryPart, PreparedQueryText } from "./query.ts";
import { FieldTransformer } from "./query-builder.ts";

interface InsertValues {
  values: any[];
  preparedValues: string;
}

export class Insert extends QueryPart {
  private transformer: FieldTransformer | null;
  private tableName: string;
  private objects: any[];

  constructor(
    transformer: FieldTransformer | null,
    tableName: string,
    objects: any[],
  ) {
    super();
    this.transformer = transformer;
    this.tableName = tableName;
    this.objects = objects;

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
    const fields = [];

    for (const key of Object.keys(exampleObject)) {
      const field = this.transformer?.toDbField(key) || key;
      fields.push(field);
    }

    return fields.join(", ");
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
