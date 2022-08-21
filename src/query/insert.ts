// We will work a lot with any since we're trying to be as generic as possible to insert anything in the db.
// deno-lint-ignore-file no-explicit-any
import { join } from "https://deno.land/std@0.141.0/path/win32.ts";
import { FieldTransformer } from "./query-builder.ts";
import { QueryPart } from "./query-part.ts";

interface InsertParts {
  fields: string[];
  values: any[];
  preparedValues: string[];
}

interface InsertFields {
  fields: string[];
  preparedFields: string;
}

interface InsertValues {
  values: any[];
  preparedValues: string;
}

export class Insert extends QueryPart {
  private transformer: FieldTransformer;
  private tableName: string;
  private objects: any[];
  private preparedArgsCounter = 1;

  constructor(
    transformer: FieldTransformer,
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

  toText(): string {
    const { fields, preparedFields } = this.extractFields();
    const { values, preparedValues } = this.extractValues();

    return `INSERT INTO ${this.tableName} ${preparedFields} VALUES ${preparedValues}`;
  }

  private extractFields(): InsertFields {
    // We'll use the first object to determine fields to update
    const exampleObject = this.objects[0];
    const fields = [];
    const preparedFieldsArray = [];

    for (const key of Object.keys(exampleObject)) {
      const field = this.transformer.toDbField(key);
      preparedFieldsArray.push(`$${this.preparedArgsCounter++}`);
      fields.push(field);
    }

    const preparedFields = `(${preparedFieldsArray.join(", ")})`;
    return { fields, preparedFields };
  }

  private extractValues(): InsertValues {
    const values: any[] = [];
    const preparedValuesArray = []; // [($1, $2, $3, $4),($1, $2, $3, $4)]
    //    let preparedValues = ""

    // ($1, $2, $3, $4), ($1, $2, $3, $4)
    for (const object of this.objects) {
      const objectPreparedValuesArray = []; // [$1, $2, $3, $4]

      // $1, $2, $3, $4
      for (const value of Object.values(object)) {
        const val = this.escapeSingleQuotes(value);
        objectPreparedValuesArray.push(`$${this.preparedArgsCounter++}`);
        values.push(val);
      }

      preparedValuesArray.push(`(${objectPreparedValuesArray.join(", ")})`);
    }

    const preparedValues = preparedValuesArray.join(", ");
    return { values, preparedValues };
  }

  private escapeSingleQuotes(value: any): any {
    return typeof value === "string" ? value.replaceAll("'", "''") : value;
  }

  // INSERT INTO wine (column1, column2) VALUES (1, 'a')
  // INSERT INTO wine VALUES (1, 'a')
}
