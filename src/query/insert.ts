// We will work a lot with any since we're trying to be as generic as possible to insert anything in the db.
// deno-lint-ignore-file no-explicit-any
import { aliasTracker } from "../orm/annotations.ts";
import { PreparedQueryText, QueryPart, TableSelector } from "./query.ts";

interface InsertValues {
  values: any[];
  preparedValues: string;
}

export class Insert extends QueryPart implements TableSelector {
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

      const tableAliases = aliasTracker[this.tableName];

      if (tableAliases) {
        // We need a reverse lookup
        for (const [_key, value] of Object.entries(tableAliases)) {
          if (value === key) {
            return _key;
          }
        }
        
        return key;
      } else {
        console.log(`Failed to get field ${key} in alias table`);
        return key;
      }
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

  getAffectedTables(): string[] {
    return [this.tableName];
  }
}
